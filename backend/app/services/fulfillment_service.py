"""
Fulfillment Service — end-to-end order fulfillment pipeline.

This orchestrates the full logistics model described in the product spec:

  Stage 1 (Supply Matching):
    match_supply() -> which farmers, how much from each

  Stage 2 (Logistics Optimization):
    1. consolidate_pickups()  -> group nearby farmers into batches
    2. decide_routing_mode()  -> direct / hub / multi_hub (cheapest)
    3. assign_truck()         -> pick a truck per batch
    4. solve_vrp()            -> optimal pickup + delivery route per batch
    5. calculate_landed_cost() -> produce + transport + handling + loss
    6. dispatch_route()       -> persist routes/stops/shipments/events

The system optimizes the ENTIRE shipment (not individual farmers) and returns
FEASIBLE / PARTIAL / INFEASIBLE with an honest reason when the order cannot be
economically fulfilled.
"""
import logging
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    Route, RouteStop, Shipment, StopType, RouteStatus,
)
from app.schemas.schemas import (
    BuyerRequirement,
    FulfillmentPlanResponse,
    VehicleRouteResponse,
    RouteStopResponse,
    LandedCostBreakdown,
    PlanExplanation,
    PlanFarmerContribution,
)
from app.services.supply_matching_service import match_supply
from app.services.consolidation_service import consolidate_pickups, PickupStop
from app.services.hub_service import decide_routing_mode
from app.services.truck_assignment_service import assign_truck
from app.services.vrp_solver import solve_vrp
from app.services.landed_cost_service import (
    calculate_landed_cost,
    FarmerAllocation,
)
from app.services.dispatch_service import dispatch_route
from app.services.maps_service import haversine, estimate_eta

logger = logging.getLogger(__name__)

# Default operating cost when a truck has no explicit value.
DEFAULT_OPERATING_COST_PER_KM = 12.0


def _build_route_stop_response(stop: RouteStop) -> RouteStopResponse:
    """Map a persisted RouteStop ORM object to its response schema."""
    return RouteStopResponse(
        id=stop.id,
        stop_type=stop.stop_type.value if hasattr(stop.stop_type, "value") else str(stop.stop_type),
        farmer_id=stop.farmer_id,
        hub_id=stop.hub_id,
        buyer_id=stop.buyer_id,
        latitude=stop.latitude,
        longitude=stop.longitude,
        quantity_kg=stop.quantity_kg,
        sequence=stop.sequence,
        time_window_earliest=stop.time_window_earliest,
        time_window_latest=stop.time_window_latest,
        max_transit_hours=stop.max_transit_hours,
        eta=stop.eta,
    )


async def create_fulfillment_plan(
    requirement: BuyerRequirement,
    db: AsyncSession,
    current_user_id: str,
) -> FulfillmentPlanResponse:
    """
    Compute and persist a complete fulfillment plan for a buyer requirement.

    Returns a FulfillmentPlanResponse with status FEASIBLE / PARTIAL / INFEASIBLE.
    """
    # ------------------------------------------------------------------
    # Stage 1: Supply matching
    # ------------------------------------------------------------------
    match = await match_supply(
        crop_name=requirement.crop_name,
        required_kg=requirement.required_quantity_kg,
        delivery_lat=requirement.delivery_latitude,
        delivery_lng=requirement.delivery_longitude,
        min_quality_grade=requirement.min_quality_grade,
        max_price_per_kg=requirement.max_price_per_kg,
        db=db,
    )

    if match.status == "INFEASIBLE" or not match.matched_farmers:
        return FulfillmentPlanResponse(
            status="INFEASIBLE",
            infeasibility_reason=match.infeasibility_reason
            or "No economically feasible supply found for this order.",
        )

    # ------------------------------------------------------------------
    # Stage 2a: Consolidate matched farmers into batches
    # ------------------------------------------------------------------
    pickups = [
        PickupStop(
            farmer_id=f.farmer_id,
            latitude=f.latitude,
            longitude=f.longitude,
            quantity_kg=f.allocated_kg,
        )
        for f in match.matched_farmers
        if f.allocated_kg > 0
    ]
    batches = consolidate_pickups(pickups)

    if not batches:
        return FulfillmentPlanResponse(
            status="INFEASIBLE",
            infeasibility_reason="Matched farmers could not be consolidated into any batch.",
        )

    # ------------------------------------------------------------------
    # Stage 2b: Decide routing mode (direct / hub / multi_hub)
    # ------------------------------------------------------------------
    farmer_locations = [
        {"lat": f.latitude, "lng": f.longitude, "quantity_kg": f.allocated_kg}
        for f in match.matched_farmers
    ]
    routing = await decide_routing_mode(
        farmer_locations=farmer_locations,
        buyer_lat=requirement.delivery_latitude,
        buyer_lng=requirement.delivery_longitude,
        total_kg=match.total_matched_kg,
        db=db,
    )

    # ------------------------------------------------------------------
    # Stage 2c/2d: For each batch, assign a truck and optimize the route
    # ------------------------------------------------------------------
    vehicle_routes: List[VehicleRouteResponse] = []
    shipment_ids: List[UUID] = []
    total_distance = 0.0
    total_duration = 0.0
    total_operating_cost = 0.0
    max_eta: Optional[datetime] = None

    for batch in batches:
        # Assign a truck that can carry this batch's load.
        truck = await assign_truck(
            required_capacity_kg=batch.total_quantity_kg,
            pickup_lat=batch.centroid_lat,
            pickup_lng=batch.centroid_lng,
            db=db,
        )
        if not truck:
            logger.warning(
                f"No available truck for batch of {batch.total_quantity_kg:.0f} kg; skipping."
            )
            continue

        # Build VRP locations: depot = batch centroid, then each farmer pickup,
        # then the buyer drop.
        vrp_locations = [
            {
                "lat": batch.centroid_lat,
                "lng": batch.centroid_lng,
                "quantity_kg": 0,
                "is_drop": False,
            }
        ]
        for stop in batch.stops:
            vrp_locations.append(
                {
                    "lat": stop.latitude,
                    "lng": stop.longitude,
                    "quantity_kg": stop.quantity_kg,
                    "is_drop": False,
                }
            )
        vrp_locations.append(
            {
                "lat": requirement.delivery_latitude,
                "lng": requirement.delivery_longitude,
                "quantity_kg": batch.total_quantity_kg,
                "is_drop": True,
                "tw_end": requirement.delivery_deadline,
            }
        )

        vrp_result = await solve_vrp(
            vrp_locations,
            [truck.capacity_kg],
        )

        if not vrp_result or not vrp_result.get("routes"):
            logger.warning(
                f"VRP could not route batch of {batch.total_quantity_kg:.0f} kg; skipping."
            )
            continue

        route = vrp_result["routes"][0]
        seq = route["route_sequence"]

        # Map VRP nodes back to stops: node 0 = depot (skip), nodes 1..n =
        # batch farmers, last node = buyer drop.
        ordered_stops = []
        for node in seq:
            if node == 0:
                continue
            if node <= len(batch.stops):
                stop = batch.stops[node - 1]
                ordered_stops.append(
                    {
                        "stop_type": StopType.PICKUP,
                        "farmer_id": stop.farmer_id,
                        "hub_id": None,
                        "buyer_id": None,
                        "lat": stop.latitude,
                        "lng": stop.longitude,
                        "qty": stop.quantity_kg,
                        "seq": len(ordered_stops) + 1,
                    }
                )
            else:
                # Buyer drop
                ordered_stops.append(
                    {
                        "stop_type": StopType.DROP,
                        "farmer_id": None,
                        "hub_id": None,
                        "buyer_id": UUID(current_user_id),
                        "lat": requirement.delivery_latitude,
                        "lng": requirement.delivery_longitude,
                        "qty": batch.total_quantity_kg,
                        "seq": len(ordered_stops) + 1,
                    }
                )

        operating_cost = (
            truck.operating_cost_per_km
            if truck.operating_cost_per_km
            else DEFAULT_OPERATING_COST_PER_KM
        )
        route_cost = route["distance_km"] * operating_cost

        # Persist this route + shipment.
        shipment = await dispatch_route(
            db=db,
            order_id=None,
            allocation_ids=[],
            vehicle_id=str(truck.id),
            route_mode=routing.mode,
            distance_km=route["distance_km"],
            duration_min=route["duration_min"],
            stops_data=ordered_stops,
            landed_cost=route_cost,
            consolidation_savings_km=0.0,
        )

        if not shipment:
            logger.warning("dispatch_route failed; skipping batch.")
            continue

        shipment_ids.append(shipment.id)

        # Build the response route from the persisted RouteStop records.
        # Query them directly (avoid lazy-loading the relationship in async).
        from sqlalchemy import select
        stops_result = await db.execute(
            select(RouteStop)
            .where(RouteStop.route_id == shipment.route_id)
            .order_by(RouteStop.sequence)
        )
        stop_responses = [
            _build_route_stop_response(rs)
            for rs in stops_result.scalars().all()
        ]

        vehicle_routes.append(
            VehicleRouteResponse(
                vehicle_id=truck.id,
                stops=stop_responses,
                distance_km=route["distance_km"],
                duration_min=route["duration_min"],
                load_kg=route["load_kg"],
                operating_cost=round(route_cost, 2),
            )
        )

        total_distance += route["distance_km"]
        total_duration += route["duration_min"]
        total_operating_cost += route_cost

        # Track the latest ETA across all routes.
        if requirement.delivery_deadline:
            eta = estimate_eta(
                datetime.now(timezone.utc),
                route["distance_km"],
            )
            if max_eta is None or eta > max_eta:
                max_eta = eta

    if not vehicle_routes:
        return FulfillmentPlanResponse(
            status="INFEASIBLE",
            infeasibility_reason="No truck could be assigned to any consolidated batch.",
        )

    # ------------------------------------------------------------------
    # Stage 2e: Landed cost
    # ------------------------------------------------------------------
    allocations = [
        FarmerAllocation(
            farmer_id=str(f.farmer_id),
            quantity_kg=f.allocated_kg,
            price_per_kg=f.price_per_kg,
            distance_km=f.distance_km,
        )
        for f in match.matched_farmers
    ]
    transit_hours = total_duration / 60.0
    landed = calculate_landed_cost(
        allocations=allocations,
        total_route_distance_km=total_distance,
        operating_cost_per_km=DEFAULT_OPERATING_COST_PER_KM,
        transit_hours=transit_hours,
        uses_hub=(routing.mode in ("hub", "multi_hub")),
    )

    # ------------------------------------------------------------------
    # Stage 2f: Decision Explanation
    # ------------------------------------------------------------------
    selected_farmers_expl = [
        PlanFarmerContribution(
            farmer_id=str(f.farmer_id),
            farmer_name=f.farmer_name,
            allocated_kg=f.allocated_kg,
            price_per_kg=f.price_per_kg,
            distance_km=f.distance_km,
        )
        for f in match.matched_farmers
        if f.allocated_kg > 0
    ]

    selected_hub_name = None
    if routing.mode == "hub" and routing.local_hub:
        selected_hub_name = f"{routing.local_hub.name} (Local Hub)"
    elif routing.mode == "multi_hub":
        l_name = routing.local_hub.name if routing.local_hub else "Local Hub"
        r_name = routing.regional_hub.name if routing.regional_hub else "Regional Hub"
        selected_hub_name = f"{l_name} -> {r_name} (Regional Hubs)"
    else:
        selected_hub_name = "None (Direct Route: Farmer to Buyer)"

    fulfillment_pct = (
        round((match.total_matched_kg / requirement.required_quantity_kg) * 100.0, 1)
        if requirement.required_quantity_kg > 0
        else 100.0
    )

    savings_vs_individual = max(0.0, (len(selected_farmers_expl) - 1) * 35.0 * DEFAULT_OPERATING_COST_PER_KM)

    why_selected_parts = [
        f"Selected {len(selected_farmers_expl)} farmer(s) aggregating {match.total_matched_kg:.0f} kg ({fulfillment_pct}% fulfillment).",
        f"Routing mode '{routing.mode}' chosen: {routing.reason}.",
        f"Assigned {len(vehicle_routes)} optimized vehicle route(s) covering {total_distance:.1f} km total distance.",
        f"Total landed cost is ₹{landed.total:.2f} (₹{landed.cost_per_kg:.2f}/kg, delivered: ₹{landed.cost_per_delivered_kg:.2f}/kg) with expected spoilage of only {landed.expected_spoilage_kg:.1f} kg.",
    ]
    if savings_vs_individual > 0:
        why_selected_parts.append(f"Consolidation saved an estimated ₹{savings_vs_individual:.0f} compared to unpooled single-farmer trips.")

    explanation = PlanExplanation(
        selected_farmers=selected_farmers_expl,
        total_allocated_kg=match.total_matched_kg,
        fulfillment_percentage=fulfillment_pct,
        selected_hub=selected_hub_name,
        selected_vehicles=[
            {"vehicle_id": str(vr.vehicle_id), "load_kg": vr.load_kg, "distance_km": vr.distance_km}
            for vr in vehicle_routes
        ],
        route_summary={
            "routing_mode": routing.mode,
            "total_stops": sum(len(vr.stops) for vr in vehicle_routes),
            "total_distance_km": round(total_distance, 2),
            "total_duration_hours": round(total_duration / 60.0, 2),
        },
        total_distance_km=round(total_distance, 2),
        total_duration_hours=round(total_duration / 60.0, 2),
        eta=max_eta,
        cost_breakdown={
            "produce_cost": landed.produce_cost,
            "fuel_cost": landed.fuel_cost,
            "driver_cost": landed.driver_cost,
            "toll_charges": landed.toll_charges,
            "loading_unloading": landed.loading_unloading_cost,
            "hub_handling": landed.hub_handling_cost,
            "cold_chain": landed.cold_chain_cost,
            "expected_spoilage": landed.expected_spoilage_cost,
            "total_landed": landed.total,
        },
        total_cost=landed.total,
        cost_per_kg=landed.cost_per_kg,
        cost_per_delivered_kg=landed.cost_per_delivered_kg,
        estimated_savings_inr=round(savings_vs_individual, 2),
        why_selected=" ".join(why_selected_parts),
    )

    # ------------------------------------------------------------------
    # Assemble the response
    # ------------------------------------------------------------------
    status = match.status  # FEASIBLE / PARTIAL
    if not landed.is_economically_viable:
        status = "INFEASIBLE"

    return FulfillmentPlanResponse(
        status=status,
        infeasibility_reason=(
            landed.warning if not landed.is_economically_viable else match.infeasibility_reason
        ),
        routing_mode=routing.mode,
        vehicle_routes=vehicle_routes,
        landed_cost=landed,
        consolidation_savings_km=round(savings_vs_individual / DEFAULT_OPERATING_COST_PER_KM, 1),
        estimated_delivery=max_eta,
        shipment_ids=shipment_ids,
        explanation=explanation,
    )
