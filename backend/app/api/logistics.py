"""
Logistics API
Wires together the entire AI-powered fulfillment pipeline.
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.schemas.schemas import BuyerRequirement, FulfillmentPlanResponse, TrackingStatus
from app.services.supply_matching_service import match_supply
from app.services.consolidation_service import consolidate_pickups, PickupStop
from app.services.hub_service import decide_routing_mode
from app.services.truck_assignment_service import assign_truck
from app.services.vrp_solver import solve_vrp
from app.services.landed_cost_service import calculate_landed_cost, FarmerAllocation

router = APIRouter(prefix="/logistics", tags=["Logistics - Orchestration"])
logger = logging.getLogger(__name__)


@router.post("/fulfill-order", response_model=FulfillmentPlanResponse)
async def fulfill_order(req: BuyerRequirement, db: AsyncSession = Depends(get_db)):
    """
    Main orchestration endpoint for AI-powered logistics.
    Implements the full 5-stage pipeline:
    1. Match Supply
    2. Consolidate
    3. Route Mode Decision (Direct vs Hub)
    4. Vehicle Assignment
    5. VRP Routing & Landed Cost
    """
    # 1. Supply Matching (Stage 1)
    match_res = await match_supply(
        crop_name=req.crop_name,
        required_kg=req.required_quantity_kg,
        delivery_lat=req.delivery_latitude,
        delivery_lng=req.delivery_longitude,
        min_quality_grade=req.min_quality_grade,
        max_price_per_kg=req.max_price_per_kg,
        db=db
    )
    
    if match_res.status == "INFEASIBLE":
        return FulfillmentPlanResponse(
            status="INFEASIBLE",
            infeasibility_reason=match_res.infeasibility_reason
        )

    # Convert matches to PickupStops for consolidation
    pickup_stops = [
        PickupStop(
            farmer_id=m.farmer_id,
            latitude=m.latitude,
            longitude=m.longitude,
            quantity_kg=m.allocated_kg
        ) for m in match_res.matched_farmers
    ]

    # 2. Consolidation (Stage 2)
    batches = consolidate_pickups(pickup_stops)
    if not batches:
        return FulfillmentPlanResponse(
            status="INFEASIBLE",
            infeasibility_reason="Failed to consolidate farmer pickups."
        )

    # For simplicity in this MVP, we route the largest batch first
    primary_batch = max(batches, key=lambda b: b.total_quantity_kg)
    
    farmer_locations = [
        {"lat": s.latitude, "lng": s.longitude, "quantity_kg": s.quantity_kg}
        for s in primary_batch.stops
    ]

    # 3. Hub Routing Decision (Stage 3)
    hub_decision = await decide_routing_mode(
        farmer_locations=farmer_locations,
        buyer_lat=req.delivery_latitude,
        buyer_lng=req.delivery_longitude,
        total_kg=primary_batch.total_quantity_kg,
        db=db
    )

    # 4. Truck Assignment
    truck = await assign_truck(
        required_capacity_kg=primary_batch.total_quantity_kg,
        pickup_lat=primary_batch.centroid_lat,
        pickup_lng=primary_batch.centroid_lng,
        db=db,
        vehicle_type="refrigerated" if "tomato" in req.crop_name.lower() else "standard"
    )

    if not truck:
        return FulfillmentPlanResponse(
            status="INFEASIBLE",
            infeasibility_reason="No trucks available with sufficient capacity near the pickup batch."
        )

    # 5. Route Optimization (VRP)
    # Build location array for VRP
    vrp_locations = []
    # Start at truck's current location (Depot)
    vrp_locations.append({
        "lat": truck.latitude or primary_batch.centroid_lat,
        "lng": truck.longitude or primary_batch.centroid_lng,
        "quantity_kg": 0,
        "is_drop": False
    })
    
    # Add pickups
    for stop in primary_batch.stops:
        vrp_locations.append({
            "lat": stop.latitude,
            "lng": stop.longitude,
            "quantity_kg": stop.quantity_kg,
            "is_drop": False
        })
        
    # Add drops (Direct = buyer, Hub = local hub)
    if hub_decision.mode == "direct":
        vrp_locations.append({
            "lat": req.delivery_latitude,
            "lng": req.delivery_longitude,
            "quantity_kg": primary_batch.total_quantity_kg,
            "is_drop": True
        })
    elif hub_decision.mode in ["hub", "multi_hub"] and hub_decision.local_hub:
        vrp_locations.append({
            "lat": hub_decision.local_hub.latitude,
            "lng": hub_decision.local_hub.longitude,
            "quantity_kg": primary_batch.total_quantity_kg,
            "is_drop": True
        })

    vrp_res = await solve_vrp(vrp_locations, [truck.capacity_kg])
    
    if not vrp_res:
        return FulfillmentPlanResponse(
            status="INFEASIBLE",
            infeasibility_reason="VRP Solver failed to find a valid route respecting time windows."
        )

    # 6. Landed Cost Calculation
    allocations = [
        FarmerAllocation(
            farmer_id=str(m.farmer_id),
            quantity_kg=m.allocated_kg,
            price_per_kg=m.price_per_kg,
            distance_km=m.distance_km
        ) for m in match_res.matched_farmers
    ]
    
    cost_breakdown = calculate_landed_cost(
        allocations=allocations,
        total_route_distance_km=vrp_res["total_distance_km"],
        operating_cost_per_km=truck.operating_cost_per_km,
        transit_hours=5.0,  # rough estimate for MVP
        uses_hub=(hub_decision.mode != "direct")
    )

    if not cost_breakdown.is_economically_viable:
        logger.warning(f"Plan not economically viable: {cost_breakdown.warning}")

    return FulfillmentPlanResponse(
        status=match_res.status,
        routing_mode=hub_decision.mode,
        landed_cost=cost_breakdown,
        consolidation_savings_km=0.0,  # to calculate fully we need a baseline
        vehicle_routes=[{
            "vehicle_id": truck.id,
            "stops": [],  # mapped from VRP response in a real implementation
            "distance_km": vrp_res["total_distance_km"],
            "duration_min": 300, # placeholder
            "load_kg": primary_batch.total_quantity_kg,
            "operating_cost": vrp_res["total_distance_km"] * truck.operating_cost_per_km
        }]
    )


@router.get("/tracking/{shipment_id}", response_model=TrackingStatus)
async def get_tracking(shipment_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Get live tracking status for a shipment.
    """
    # Mock response for now, in a real implementation this fetches LogisticsEvents
    return TrackingStatus(
        shipment_id=shipment_id,
        current_status="in_transit",
        events=[]
    )
