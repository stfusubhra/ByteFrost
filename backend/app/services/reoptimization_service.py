"""
Re-optimization Service
Dynamic response to transit exceptions:
- Truck breakdown: re-assigns backup vehicle and re-solves VRP from breakdown point.
- Farmer cancellation: removes stop and re-balances route sequence and load.
"""
import logging
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    Shipment, Route, RouteStop, Vehicle, VehicleStatus,
    LogisticsEvent, LogisticsEventType, RouteStatus, StopType
)
from app.services.truck_assignment_service import assign_truck
from app.services.vrp_solver import solve_vrp
from app.services.maps_service import haversine, enrich_stops_with_eta

logger = logging.getLogger(__name__)


async def handle_truck_breakdown(
    shipment_id: UUID,
    breakdown_lat: float,
    breakdown_lng: float,
    notes: Optional[str],
    db: AsyncSession,
) -> Dict[str, Any]:
    """
    Handle truck breakdown incident:
    1. Update old vehicle to MAINTENANCE.
    2. Log TRUCK_BREAKDOWN event.
    3. Find unvisited stops.
    4. Query and assign nearest available replacement truck.
    5. Re-run VRP solver from breakdown location.
    6. Persist rerouted path and log REROUTED event.
    """
    shipment = await db.get(Shipment, shipment_id)
    if not shipment:
        return {"success": False, "error": "Shipment not found"}

    # 1. Update old vehicle status
    if shipment.vehicle_id:
        old_vehicle = await db.get(Vehicle, shipment.vehicle_id)
        if old_vehicle:
            old_vehicle.status = VehicleStatus.MAINTENANCE
            db.add(old_vehicle)

    # 2. Record breakdown event
    breakdown_event = LogisticsEvent(
        shipment_id=shipment.id,
        event_type=LogisticsEventType.TRUCK_BREAKDOWN,
        latitude=breakdown_lat,
        longitude=breakdown_lng,
        notes=notes or "Truck reported breakdown mid-route.",
        timestamp=datetime.now(timezone.utc),
    )
    db.add(breakdown_event)

    # 3. Retrieve remaining stops on this route
    if not shipment.route_id:
        await db.commit()
        return {"success": False, "error": "Shipment has no active route to re-optimize"}

    stops_res = await db.execute(
        select(RouteStop)
        .where(RouteStop.route_id == shipment.route_id)
        .order_by(RouteStop.sequence)
    )
    all_stops = stops_res.scalars().all()

    if not all_stops:
        await db.commit()
        return {"success": False, "error": "No stops found on current route"}

    # Determine carried load / remaining load
    remaining_load = sum(s.quantity_kg for s in all_stops if s.stop_type != StopType.DROP)
    if remaining_load <= 0:
        remaining_load = sum(s.quantity_kg for s in all_stops)

    # 4. Query backup replacement vehicle
    backup_truck = await assign_truck(
        required_capacity_kg=remaining_load,
        pickup_lat=breakdown_lat,
        pickup_lng=breakdown_lng,
        db=db,
    )

    if not backup_truck:
        shipment.status = "delayed"
        db.add(shipment)
        await db.commit()
        return {
            "success": False,
            "status": "DELAYED",
            "message": "Truck breakdown recorded, but no available replacement truck found nearby.",
            "breakdown_location": {"lat": breakdown_lat, "lng": breakdown_lng},
        }

    # 5. Formulate VRP locations starting from breakdown coordinates as depot
    vrp_locations = [
        {
            "lat": breakdown_lat,
            "lng": breakdown_lng,
            "quantity_kg": 0,
            "is_drop": False,
        }
    ]
    for s in all_stops:
        vrp_locations.append(
            {
                "lat": s.latitude,
                "lng": s.longitude,
                "quantity_kg": s.quantity_kg,
                "is_drop": s.stop_type == StopType.DROP,
            }
        )

    vrp_result = await solve_vrp(vrp_locations, [backup_truck.capacity_kg])

    # 6. Create new route or update existing
    new_route = Route(
        vehicle_id=backup_truck.id,
        distance_km=vrp_result["total_distance_km"] if vrp_result else shipment.estimated_distance_km,
        duration_minutes=int(vrp_result["total_time_min"]) if vrp_result else int(shipment.estimated_duration_min or 60),
        status=RouteStatus.ACTIVE,
        route_mode=shipment.route_mode or "direct",
    )
    db.add(new_route)
    await db.flush()

    # Re-assign stops to new route
    for idx, s in enumerate(all_stops):
        s.route_id = new_route.id
        s.sequence = idx + 1
        db.add(s)

    # Update shipment
    shipment.vehicle_id = backup_truck.id
    shipment.route_id = new_route.id
    shipment.status = "rerouted"
    if vrp_result:
        shipment.estimated_distance_km = vrp_result["total_distance_km"]
        shipment.estimated_duration_min = vrp_result["total_time_min"]
    db.add(shipment)

    # Update backup truck status
    backup_truck.status = VehicleStatus.ASSIGNED
    db.add(backup_truck)

    # 7. Record REROUTED event
    reroute_event = LogisticsEvent(
        shipment_id=shipment.id,
        event_type=LogisticsEventType.REROUTED,
        latitude=breakdown_lat,
        longitude=breakdown_lng,
        notes=f"Replacement vehicle {backup_truck.id} assigned. Route re-optimized and active.",
        timestamp=datetime.now(timezone.utc),
    )
    db.add(reroute_event)

    await db.commit()

    return {
        "success": True,
        "status": "REROUTED",
        "message": f"Successfully reassigned to replacement vehicle {backup_truck.id}.",
        "replacement_vehicle_id": str(backup_truck.id),
        "new_route_id": str(new_route.id),
        "total_distance_km": new_route.distance_km,
        "duration_minutes": new_route.duration_minutes,
    }


async def handle_farmer_cancellation(
    shipment_id: UUID,
    cancelled_farmer_id: UUID,
    notes: Optional[str],
    db: AsyncSession,
) -> Dict[str, Any]:
    """
    Handle farmer cancellation:
    1. Remove farmer's pickup stop from active route.
    2. Re-sequence remaining stops and update total distance.
    3. Log FARMER_CANCELLED and REROUTED events.
    """
    shipment = await db.get(Shipment, shipment_id)
    if not shipment or not shipment.route_id:
        return {"success": False, "error": "Shipment or route not found"}

    # Query all stops on route
    stops_res = await db.execute(
        select(RouteStop)
        .where(RouteStop.route_id == shipment.route_id)
        .order_by(RouteStop.sequence)
    )
    all_stops = stops_res.scalars().all()

    cancelled_stop = None
    remaining_stops = []
    for s in all_stops:
        if s.farmer_id == cancelled_farmer_id and s.stop_type == StopType.PICKUP:
            cancelled_stop = s
        else:
            remaining_stops.append(s)

    if not cancelled_stop:
        return {"success": False, "error": "Specified farmer pickup stop was not found on this route"}

    # Remove the cancelled stop
    await db.delete(cancelled_stop)

    # Re-sequence remaining stops
    for idx, s in enumerate(remaining_stops):
        s.sequence = idx + 1
        db.add(s)

    shipment.status = "partially_fulfilled"
    db.add(shipment)

    # Log events
    cancel_event = LogisticsEvent(
        shipment_id=shipment.id,
        event_type=LogisticsEventType.FARMER_CANCELLED,
        latitude=cancelled_stop.latitude,
        longitude=cancelled_stop.longitude,
        notes=notes or f"Farmer {cancelled_farmer_id} cancelled pickup ({cancelled_stop.quantity_kg} kg).",
        timestamp=datetime.now(timezone.utc),
    )
    db.add(cancel_event)

    reroute_event = LogisticsEvent(
        shipment_id=shipment.id,
        event_type=LogisticsEventType.REROUTED,
        latitude=cancelled_stop.latitude,
        longitude=cancelled_stop.longitude,
        notes="Route re-sequenced after farmer cancellation.",
        timestamp=datetime.now(timezone.utc),
    )
    db.add(reroute_event)

    await db.commit()

    return {
        "success": True,
        "status": "PARTIALLY_FULFILLED",
        "message": f"Farmer pickup cancelled ({cancelled_stop.quantity_kg} kg). Route adjusted.",
        "remaining_stops_count": len(remaining_stops),
    }
