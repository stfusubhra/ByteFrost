from fastapi import APIRouter, Depends, HTTPException
import math
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.schemas import (
    RouteRequest,
    RouteOptimizationResponse,
    RouteStopOptimization,
    VehicleRouteOptimization,
    BuyerRequirement,
    FulfillmentPlanResponse,
    HubCapacityResponse,
    HubRoutingEvaluationRequest,
    HubRoutingEvaluationResponse,
    HubCandidateDetail,
    VehicleMatchRequest,
    VehicleMatchResponse,
    MatchedVehicleDetail,
)
from app.models.models import Hub
from app.services.vrp_solver import solve_vrp
from app.services.fulfillment_service import create_fulfillment_plan
from app.services.consolidation_service import consolidate_pickups, PickupStop
from app.services.maps_service import haversine
from app.services.hub_service import get_hub_capacity_status, decide_routing_mode
from app.services.truck_assignment_service import match_vehicles

router = APIRouter()


def _estimate_duration_min(distance_km: float) -> float:
    """Estimate travel time assuming ~40 km/h average (rural last-mile)."""
    return (distance_km / 40.0) * 60.0


def _nearest_neighbor_route(stops, start):
    """
    Greedy nearest-neighbor TSP over a list of stops.
    Returns an ordered list of stop indices and the total distance.
    """
    remaining = list(range(len(stops)))
    order = []
    current = start
    total = 0.0
    while remaining:
        # Find nearest remaining stop to current.
        best_idx = min(
            remaining,
            key=lambda i: haversine(
                current["lat"], current["lng"], stops[i]["lat"], stops[i]["lng"]
            ),
        )
        total += haversine(
            current["lat"], current["lng"], stops[best_idx]["lat"], stops[best_idx]["lng"]
        )
        order.append(best_idx)
        current = stops[best_idx]
        remaining.remove(best_idx)
    return order, total


@router.post("/optimize-route", response_model=RouteOptimizationResponse)
async def optimize_route(
    payload: RouteRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Build delivery routes from real pickup/drop locations.

    Uses the OR-Tools VRP solver (with time windows and capacity constraints) to
    compute optimal multi-stop routes. If OR-Tools cannot find a feasible
    solution, it falls back to a greedy nearest-neighbor heuristic so the
    endpoint always returns a usable plan. Distances are computed from the
    provided coordinates (no fabricated numbers).
    """
    if not payload.pickup_locations and not payload.drop_locations:
        raise HTTPException(status_code=400, detail="No pickup or drop locations provided")

    if payload.vehicle_capacity_kg <= 0:
        raise HTTPException(status_code=400, detail="vehicle_capacity_kg must be positive")

    # Build a combined list of stops with their type and quantity.
    stops = []
    for p in payload.pickup_locations:
        stops.append(
            {
                "type": "pickup",
                "lat": p.get("lat"),
                "lng": p.get("lng"),
                "quantity": p.get("quantity", 0),
            }
        )
    for d in payload.drop_locations:
        stops.append(
            {
                "type": "drop",
                "lat": d.get("lat"),
                "lng": d.get("lng"),
                "quantity": d.get("quantity", 0),
            }
        )

    # Validate coordinates.
    for s in stops:
        if s["lat"] is None or s["lng"] is None:
            raise HTTPException(status_code=400, detail="Every stop needs lat and lng")

    # Total load to move.
    total_load = sum(s["quantity"] for s in stops)
    vehicle_count = max(1, math.ceil(total_load / payload.vehicle_capacity_kg))

    # --- Primary: OR-Tools VRP solver ---
    # Build the VRP location array. The first location (index 0) is a virtual
    # depot where every vehicle starts and ends. We place it at the first stop's
    # coordinates so routes begin at a real point, but it carries no load. All
    # pickups (including the first) and drops are real stops with their own
    # quantities, so capacity is enforced correctly across vehicles.
    vrp_locations = []
    if stops:
        vrp_locations.append(
            {
                "lat": stops[0]["lat"],
                "lng": stops[0]["lng"],
                "quantity_kg": 0,
                "is_drop": False,
            }
        )
        for s in stops:
            vrp_locations.append(
                {
                    "lat": s["lat"],
                    "lng": s["lng"],
                    "quantity_kg": s["quantity"],
                    "is_drop": s["type"] == "drop",
                    "tw_end": payload.deadline if s["type"] == "drop" else None,
                }
            )

    vrp_result = await solve_vrp(
        vrp_locations,
        [payload.vehicle_capacity_kg] * vehicle_count,
    )

    if vrp_result and vrp_result.get("routes"):
        # Map OR-Tools node indices back to the original stops.
        # vrp_locations[0] is the virtual depot (skipped); vrp_locations[i]
        # corresponds to stops[i - 1] for i >= 1.
        routes = []
        for route in vrp_result["routes"]:
            seq = route["route_sequence"]
            # Skip the leading/trailing depot nodes (index 0).
            ordered_stops = []
            for node in seq:
                if node == 0:
                    continue
                stop = stops[node - 1]
                ordered_stops.append(
                    RouteStopOptimization(
                        type=stop["type"],
                        lat=stop["lat"],
                        lng=stop["lng"],
                        order=len(ordered_stops) + 1,
                        quantity_kg=stop["quantity"],
                    )
                )

            routes.append(
                VehicleRouteOptimization(
                    vehicle_id=route["vehicle_index"] + 1,
                    stops=ordered_stops,
                    distance_km=route["distance_km"],
                    duration_min=route["duration_min"],
                    load_kg=route["load_kg"],
                )
            )

        return RouteOptimizationResponse(
            routes=routes,
            total_distance_km=vrp_result["total_distance_km"],
            total_duration_min=vrp_result["total_time_min"],
            vehicle_count=len(routes),
        )

    # --- Fallback: greedy nearest-neighbor heuristic ---
    # Split stops across vehicles (round-robin by load) and route each.
    routes = []
    total_distance = 0.0
    total_duration = 0.0

    # Simple load-balancing: assign stops to vehicles so each stays under capacity.
    vehicle_loads = [0.0] * vehicle_count
    vehicle_stops = [[] for _ in range(vehicle_count)]

    for s in stops:
        # Pick the vehicle with the most remaining capacity that can take this stop.
        chosen = None
        for v in range(vehicle_count):
            if vehicle_loads[v] + s["quantity"] <= payload.vehicle_capacity_kg + 1e-9:
                chosen = v
                break
        if chosen is None:
            # Fall back to the least-loaded vehicle.
            chosen = min(range(vehicle_count), key=lambda v: vehicle_loads[v])
        vehicle_stops[chosen].append(s)
        vehicle_loads[chosen] += s["quantity"]

    for v, vstops in enumerate(vehicle_stops):
        if not vstops:
            continue
        # Start from the first stop, then nearest-neighbor the rest.
        start = vstops[0]
        rest = vstops[1:]
        order, dist = _nearest_neighbor_route(rest, start)
        ordered = [start] + [rest[i] for i in order]
        duration = _estimate_duration_min(dist)

        routes.append(
            VehicleRouteOptimization(
                vehicle_id=v + 1,
                stops=[
                    RouteStopOptimization(
                        type=s["type"],
                        lat=s["lat"],
                        lng=s["lng"],
                        order=idx + 1,
                        quantity_kg=s["quantity"],
                    )
                    for idx, s in enumerate(ordered)
                ],
                distance_km=round(dist, 2),
                duration_min=round(duration, 1),
                load_kg=round(vehicle_loads[v], 2),
            )
        )
        total_distance += dist
        total_duration += duration

    return RouteOptimizationResponse(
        routes=routes,
        total_distance_km=round(total_distance, 2),
        total_duration_min=round(total_duration, 1),
        vehicle_count=len(routes),
    )


@router.post("/fulfill-order", response_model=FulfillmentPlanResponse)
async def fulfill_order(
    payload: BuyerRequirement,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    End-to-end order fulfillment.

    Runs the full two-stage logistics pipeline:
      Stage 1 — Supply matching (which farmers, how much from each)
      Stage 2 — Consolidation, routing-mode decision, truck assignment,
                VRP route optimization, landed-cost calculation, and dispatch.

    Returns a FulfillmentPlanResponse with status FEASIBLE / PARTIAL / INFEASIBLE
    and an honest reason when the order cannot be economically fulfilled.
    """
    if payload.required_quantity_kg <= 0:
        raise HTTPException(status_code=400, detail="required_quantity_kg must be positive")

    return await create_fulfillment_plan(
        requirement=payload,
        db=db,
        current_user_id=current_user["id"],
    )


@router.post("/consolidate")
async def consolidate_shipments(
    payload: RouteRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Consolidation endpoint.

    Groups nearby pickup locations into batches so they can share a truck.
    Uses the same greedy clustering as the fulfillment pipeline.
    """
    stops = []
    for p in payload.pickup_locations:
        stops.append(
            PickupStop(
                farmer_id=p.get("farmer_id", "unknown"),
                latitude=p.get("lat"),
                longitude=p.get("lng"),
                quantity_kg=p.get("quantity", 0),
            )
        )

    if not stops:
        return {"message": "No pickup locations provided", "batches": [], "total_savings_km": 0}

    batches = consolidate_pickups(stops)

    return {
        "message": f"Consolidated into {len(batches)} batches",
        "batches": [
            {
                "stops": [
                    {
                        "farmer_id": str(s.farmer_id),
                        "lat": s.latitude,
                        "lng": s.longitude,
                        "quantity_kg": s.quantity_kg,
                    }
                    for s in b.stops
                ],
                "total_quantity_kg": round(b.total_quantity_kg, 2),
                "centroid_lat": round(b.centroid_lat, 6),
                "centroid_lng": round(b.centroid_lng, 6),
            }
            for b in batches
        ],
        "total_savings_km": 0,
    }


from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from app.services.reoptimization_service import handle_truck_breakdown, handle_farmer_cancellation


class IncidentPayload(BaseModel):
    incident_type: str  # "TRUCK_BREAKDOWN" or "FARMER_CANCELLED"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    cancelled_farmer_id: Optional[UUID] = None
    notes: Optional[str] = None


@router.post("/shipments/{shipment_id}/incident")
async def report_shipment_incident(
    shipment_id: UUID,
    payload: IncidentPayload,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Report an in-transit logistics incident and trigger automated recovery:
    - TRUCK_BREAKDOWN: re-assigns backup truck and re-solves VRP from breakdown coordinates.
    - FARMER_CANCELLED: removes the cancelled pickup stop and re-balances route sequence and load.
    """
    incident_type = payload.incident_type.upper()
    if incident_type == "TRUCK_BREAKDOWN":
        if payload.latitude is None or payload.longitude is None:
            raise HTTPException(status_code=400, detail="Truck breakdown requires latitude and longitude")
        result = await handle_truck_breakdown(
            shipment_id=shipment_id,
            breakdown_lat=payload.latitude,
            breakdown_lng=payload.longitude,
            notes=payload.notes,
            db=db,
        )
        return result

    elif incident_type == "FARMER_CANCELLED":
        if not payload.cancelled_farmer_id:
            raise HTTPException(status_code=400, detail="Farmer cancellation requires cancelled_farmer_id")
        result = await handle_farmer_cancellation(
            shipment_id=shipment_id,
            cancelled_farmer_id=payload.cancelled_farmer_id,
            notes=payload.notes,
            db=db,
        )
        return result

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported incident_type. Valid values: 'TRUCK_BREAKDOWN', 'FARMER_CANCELLED'"
        )


@router.get("/hubs/{hub_id}/capacity", response_model=HubCapacityResponse)
async def get_hub_capacity_endpoint(
    hub_id: UUID,
    requested_kg: float = 0.0,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed capacity breakdown for a logistics hub:
    - total, occupied, reserved, available, incoming, and outgoing capacity.
    - evaluates whether it can accommodate the requested_kg load.
    """
    from sqlalchemy import select
    stmt = select(Hub).where(Hub.id == hub_id)
    result = await db.execute(stmt)
    hub = result.scalar_one_or_none()
    if not hub:
        raise HTTPException(status_code=404, detail="Hub not found")

    status = await get_hub_capacity_status(hub, requested_kg=requested_kg, db=db)
    return HubCapacityResponse(
        hub_id=status.hub_id,
        hub_name=status.hub_name,
        hub_type=status.hub_type,
        total_capacity_kg=status.total_capacity_kg,
        occupied_capacity_kg=status.occupied_capacity_kg,
        reserved_capacity_kg=status.reserved_capacity_kg,
        available_capacity_kg=status.available_capacity_kg,
        incoming_quantity_kg=status.incoming_quantity_kg,
        outgoing_quantity_kg=status.outgoing_quantity_kg,
        utilization_pct=status.utilization_pct,
        can_accommodate=status.can_accommodate,
    )


@router.post("/evaluate-hub-mode", response_model=HubRoutingEvaluationResponse)
async def evaluate_hub_mode_endpoint(
    payload: HubRoutingEvaluationRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Evaluate and compare routing modes:
      - Direct (Farmer -> Buyer)
      - Local Hub (Farmer -> Local Hub -> Buyer)
      - Regional Hub (Farmer -> Local Hub -> Regional Hub -> Buyer)
    Considers transportation cost, hub handling, loading delays, travel times,
    buyer deadlines, freshness shelf-life, and hub capacity.
    """
    decision = await decide_routing_mode(
        farmer_locations=payload.farmer_locations,
        buyer_lat=payload.buyer_latitude,
        buyer_lng=payload.buyer_longitude,
        total_kg=payload.total_kg,
        db=db,
        delivery_deadline=payload.delivery_deadline,
        max_freshness_hours=payload.max_freshness_hours,
    )

    local_hub_detail = None
    if decision.local_hub:
        local_hub_detail = HubCandidateDetail(
            hub_id=decision.local_hub.hub_id,
            name=decision.local_hub.name,
            hub_type=decision.local_hub.hub_type,
            latitude=decision.local_hub.latitude,
            longitude=decision.local_hub.longitude,
            capacity_kg=decision.local_hub.capacity_kg,
            available_kg=decision.local_hub.available_kg,
            distance_to_centroid_km=decision.local_hub.distance_to_centroid_km,
        )

    regional_hub_detail = None
    if decision.regional_hub:
        regional_hub_detail = HubCandidateDetail(
            hub_id=decision.regional_hub.hub_id,
            name=decision.regional_hub.name,
            hub_type=decision.regional_hub.hub_type,
            latitude=decision.regional_hub.latitude,
            longitude=decision.regional_hub.longitude,
            capacity_kg=decision.regional_hub.capacity_kg,
            available_kg=decision.regional_hub.available_kg,
            distance_to_centroid_km=decision.regional_hub.distance_to_centroid_km,
        )

    return HubRoutingEvaluationResponse(
        mode=decision.mode,
        local_hub=local_hub_detail,
        regional_hub=regional_hub_detail,
        direct_cost_estimate=decision.direct_cost_estimate,
        hub_cost_estimate=decision.hub_cost_estimate,
        multi_hub_cost_estimate=decision.multi_hub_cost_estimate,
        direct_duration_hours=decision.direct_duration_hours,
        hub_duration_hours=decision.hub_duration_hours,
        multi_hub_duration_hours=decision.multi_hub_duration_hours,
        is_direct_feasible=decision.is_direct_feasible,
        is_hub_feasible=decision.is_hub_feasible,
        is_multi_hub_feasible=decision.is_multi_hub_feasible,
        reason=decision.reason,
    )


@router.post("/match-vehicles", response_model=VehicleMatchResponse)
async def match_vehicles_endpoint(
    payload: VehicleMatchRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Match vehicles for a load requirement evaluating:
      - Net available capacity (capacity - current load)
      - Vehicle type and refrigeration requirement
      - Proximity to pickup location
      - Operating cost per km and max duration
    Determines whether a single truck or multiple trucks are needed,
    and strictly enforces that produce is never assigned with insufficient capacity.
    """
    result = await match_vehicles(
        required_capacity_kg=payload.required_capacity_kg,
        pickup_lat=payload.pickup_latitude,
        pickup_lng=payload.pickup_longitude,
        db=db,
        requires_refrigeration=payload.requires_refrigeration,
        max_distance_km=payload.max_distance_km,
        max_duration_hours=payload.max_duration_hours,
    )

    vehicles_detail = [
        MatchedVehicleDetail(
            vehicle_id=v.vehicle_id,
            vehicle_type=v.vehicle_type,
            capacity_kg=v.capacity_kg,
            current_load_kg=v.current_load_kg,
            net_available_kg=v.net_available_kg,
            allocated_load_kg=v.allocated_load_kg,
            operating_cost_per_km=v.operating_cost_per_km,
            distance_to_pickup_km=v.distance_to_pickup_km,
            score=v.score,
        )
        for v in result.vehicles
    ]

    return VehicleMatchResponse(
        status=result.status,
        required_kg=result.required_kg,
        total_allocated_kg=result.total_allocated_kg,
        shortfall_kg=result.shortfall_kg,
        vehicles=vehicles_detail,
        requires_multiple_vehicles=result.requires_multiple_vehicles,
        refrigeration_met=result.refrigeration_met,
        explanation=result.explanation,
    )

