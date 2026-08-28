"""
Truck Assignment Service
Finds available trucks matching capacity requirements.

Problems addressed:
- #27: Ensure truck capacity handles consolidated batch
- #17: Assign nearest available truck
"""
import logging
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Vehicle, VehicleStatus
from app.services.maps_service import haversine

logger = logging.getLogger(__name__)


async def find_available_trucks(
    required_capacity_kg: float,
    pickup_lat: float,
    pickup_lng: float,
    db: AsyncSession,
    max_distance_km: float = 100.0,
    vehicle_type: str = "standard"
) -> List[Vehicle]:
    """
    Find available vehicles that can handle the load and are nearby.
    """
    stmt = select(Vehicle).where(
        and_(
            Vehicle.status == VehicleStatus.AVAILABLE,
            Vehicle.capacity_kg >= required_capacity_kg
            # Note: Enum comparison requires name match or casting, string is usually fine in basic SQLAlchemy depending on setup.
            # We'll filter type in python or cast in SQL.
        )
    )
    result = await db.execute(stmt)
    vehicles = result.scalars().all()

    # Filter by type and distance
    eligible = []
    for v in vehicles:
        if v.vehicle_type.value != vehicle_type:
            continue
            
        if v.latitude and v.longitude:
            dist = haversine(pickup_lat, pickup_lng, v.latitude, v.longitude)
            if dist <= max_distance_km:
                # Add distance as a temporary attribute for sorting
                v._distance_to_pickup = dist
                eligible.append(v)
        else:
            # If no location known, assume it's available but put it at the end
            v._distance_to_pickup = 9999.0
            eligible.append(v)

    # Sort by distance
    eligible.sort(key=lambda x: x._distance_to_pickup)
    return eligible


async def assign_truck(
    required_capacity_kg: float,
    pickup_lat: float,
    pickup_lng: float,
    db: AsyncSession,
    vehicle_type: str = "standard"
) -> Optional[Vehicle]:
    """Assigns the best single truck for the route."""
    trucks = await find_available_trucks(
        required_capacity_kg, pickup_lat, pickup_lng, db, vehicle_type=vehicle_type
    )
    
    if not trucks:
        return None
        
    return trucks[0]
