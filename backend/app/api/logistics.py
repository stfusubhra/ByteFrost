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
)
from app.services.vrp_solver import solve_vrp
from app.services.fulfillment_service import create_fulfillment_plan
from app.services.consolidation_service import consolidate_pickups, PickupStop
from app.services.maps_service import haversine

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
