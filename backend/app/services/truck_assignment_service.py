"""
Vehicle Matching & Fleet Allocation Service
Matches vehicles using:
- Capacity and current load (net available capacity = capacity - current_load)
- Vehicle type & refrigeration requirements (standard vs refrigerated)
- Current location & distance to pickup
- Availability (status == AVAILABLE)
- Operating cost per km
- Maximum route duration (travel time limits)

Features:
- Single vehicle matching (when a single truck can carry the load)
- Multi-vehicle matching (when multiple trucks are required)
- Strict capacity enforcement: NEVER assign a vehicle/fleet with insufficient capacity.
"""
import logging
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Vehicle, VehicleStatus, VehicleType
from app.services.maps_service import haversine

logger = logging.getLogger(__name__)

AVERAGE_TRUCK_SPEED_KMH = 40.0
DEFAULT_MAX_REPOSITION_HOURS = 4.0  # Max travel time to first pickup point


@dataclass
class MatchedVehicleItem:
    vehicle_id: UUID
    vehicle_type: str
    capacity_kg: float
    current_load_kg: float
    net_available_kg: float
    allocated_load_kg: float
    operating_cost_per_km: float
    distance_to_pickup_km: float
    score: float


@dataclass
class VehicleMatchResult:
    status: str  # "MATCHED" / "INSUFFICIENT_CAPACITY" / "NO_VEHICLES_AVAILABLE"
    required_kg: float
    total_allocated_kg: float
    shortfall_kg: float
    vehicles: List[MatchedVehicleItem] = field(default_factory=list)
    requires_multiple_vehicles: bool = False
    refrigeration_met: bool = True
    explanation: str = ""


def match_vehicles_from_candidates(
    candidates: List[MatchedVehicleItem],
    required_capacity_kg: float,
    requires_refrigeration: bool = False,
    max_distance_km: float = 150.0,
    max_duration_hours: float = 14.0,
) -> VehicleMatchResult:
    """
    Pure algorithmic matcher that evaluates single and multiple vehicle combinations.
    Enforces that produce is never assigned to vehicles with insufficient capacity.
    """
    if required_capacity_kg <= 0:
        return VehicleMatchResult(
            status="INSUFFICIENT_CAPACITY",
            required_kg=required_capacity_kg,
            total_allocated_kg=0.0,
            shortfall_kg=0.0,
            explanation="Required capacity must be greater than zero.",
        )

    # 1. Filter by refrigeration requirement
    eligible: List[MatchedVehicleItem] = []
    for c in candidates:
        is_refrig = c.vehicle_type.upper() == "REFRIGERATED"
        if requires_refrigeration and not is_refrig:
            continue  # Crop requires cold chain, skip standard vehicle

        # Distance & repositioning duration check
        if c.distance_to_pickup_km > max_distance_km:
            continue
        reposition_hours = c.distance_to_pickup_km / AVERAGE_TRUCK_SPEED_KMH
        if reposition_hours > max_duration_hours:
            continue

        # Net available capacity check
        if c.net_available_kg <= 0:
            continue

        eligible.append(c)

    if not eligible:
        reason = "No refrigerated vehicles available nearby" if requires_refrigeration else "No available vehicles within operating range"
        return VehicleMatchResult(
            status="NO_VEHICLES_AVAILABLE",
            required_kg=required_capacity_kg,
            total_allocated_kg=0.0,
            shortfall_kg=required_capacity_kg,
            refrigeration_met=not requires_refrigeration,
            explanation=reason,
        )

    # 2. Score candidates
    # Factors:
    # - Capacity fit (lower waste preferred for single vehicle)
    # - Distance to pickup (closer is better)
    # - Operating cost per km (lower is better)
    for c in eligible:
        dist_score = 1.0 / (1.0 + c.distance_to_pickup_km / 50.0)
        cost_score = 1.0 / (1.0 + c.operating_cost_per_km / 12.0)
        cap_ratio = min(1.0, c.net_available_kg / required_capacity_kg)
        c.score = round(0.40 * dist_score + 0.35 * cap_ratio + 0.25 * cost_score, 4)

    # 3. PHASE A: Single Vehicle Match
    # Check if a single vehicle can handle the entire required load
    single_vehicle_candidates = [
        c for c in eligible if c.net_available_kg >= required_capacity_kg
    ]
    if single_vehicle_candidates:
        # Sort single candidates by least capacity waste, then distance and cost
        single_vehicle_candidates.sort(
            key=lambda c: (
                (c.net_available_kg - required_capacity_kg),  # Minimize excess unused capacity
                c.distance_to_pickup_km,
                c.operating_cost_per_km,
            )
        )
        best = single_vehicle_candidates[0]
        best.allocated_load_kg = required_capacity_kg

        return VehicleMatchResult(
            status="MATCHED",
            required_kg=required_capacity_kg,
            total_allocated_kg=required_capacity_kg,
            shortfall_kg=0.0,
            vehicles=[best],
            requires_multiple_vehicles=False,
            refrigeration_met=True,
            explanation=(
                f"Single {best.vehicle_type.lower()} truck assigned: {best.capacity_kg:.0f} kg capacity "
                f"({required_capacity_kg:.0f} kg load allocated, {best.distance_to_pickup_km:.1f} km away)."
            ),
        )

    # 4. PHASE B: Multiple Vehicles Match
    # When no single vehicle can fulfill the load, allocate across multiple vehicles
    # Sort eligible vehicles by highest available capacity, then proximity
    eligible.sort(
        key=lambda c: (-c.net_available_kg, c.distance_to_pickup_km, c.operating_cost_per_km)
    )

    remaining = required_capacity_kg
    allocated_vehicles: List[MatchedVehicleItem] = []

    for v in eligible:
        if remaining <= 0:
            break
        alloc = min(v.net_available_kg, remaining)
        v.allocated_load_kg = round(alloc, 2)
        remaining -= alloc
        allocated_vehicles.append(v)

    total_allocated = sum(v.allocated_load_kg for v in allocated_vehicles)

    if remaining <= 0:
        return VehicleMatchResult(
            status="MATCHED",
            required_kg=required_capacity_kg,
            total_allocated_kg=round(total_allocated, 2),
            shortfall_kg=0.0,
            vehicles=allocated_vehicles,
            requires_multiple_vehicles=True,
            refrigeration_met=True,
            explanation=(
                f"Multiple vehicles required: {len(allocated_vehicles)} trucks assigned to fulfill "
                f"{required_capacity_kg:.0f} kg load (Combined capacity: {sum(v.capacity_kg for v in allocated_vehicles):.0f} kg)."
            ),
        )
    else:
        # Strict enforcement: Never assign produce to a fleet with insufficient capacity
        return VehicleMatchResult(
            status="INSUFFICIENT_CAPACITY",
            required_kg=required_capacity_kg,
            total_allocated_kg=round(total_allocated, 2),
            shortfall_kg=round(remaining, 2),
            vehicles=[],  # Do not assign insufficient fleet
            requires_multiple_vehicles=True,
            refrigeration_met=True,
            explanation=(
                f"Insufficient fleet capacity: Needed {required_capacity_kg:.0f} kg, but only "
                f"{total_allocated:.0f} kg available across all active vehicles (shortfall: {remaining:.0f} kg)."
            ),
        )


async def match_vehicles(
    required_capacity_kg: float,
    pickup_lat: float,
    pickup_lng: float,
    db: AsyncSession,
    requires_refrigeration: bool = False,
    max_distance_km: float = 150.0,
    max_duration_hours: float = 14.0,
) -> VehicleMatchResult:
    """
    Database-backed vehicle matching for a pickup centroid and load requirement.
    """
    stmt = select(Vehicle).where(Vehicle.status == VehicleStatus.AVAILABLE)
    result = await db.execute(stmt)
    vehicles = result.scalars().all()

    candidates: List[MatchedVehicleItem] = []
    for v in vehicles:
        v_lat = v.latitude or 0.0
        v_lng = v.longitude or 0.0
        dist = haversine(pickup_lat, pickup_lng, v_lat, v_lng) if (v_lat != 0.0 and v_lng != 0.0) else 50.0
        net_avail = max(0.0, float(v.capacity_kg) - float(v.current_load_kg or 0.0))

        candidates.append(
            MatchedVehicleItem(
                vehicle_id=v.id,
                vehicle_type=v.vehicle_type.value if hasattr(v.vehicle_type, "value") else str(v.vehicle_type),
                capacity_kg=float(v.capacity_kg),
                current_load_kg=float(v.current_load_kg or 0.0),
                net_available_kg=round(net_avail, 2),
                allocated_load_kg=0.0,
                operating_cost_per_km=float(v.operating_cost_per_km or 12.0),
                distance_to_pickup_km=round(dist, 2),
                score=0.0,
            )
        )

    return match_vehicles_from_candidates(
        candidates=candidates,
        required_capacity_kg=required_capacity_kg,
        requires_refrigeration=requires_refrigeration,
        max_distance_km=max_distance_km,
        max_duration_hours=max_duration_hours,
    )


async def assign_truck(
    required_capacity_kg: float,
    pickup_lat: float,
    pickup_lng: float,
    db: AsyncSession,
    vehicle_type: str = "standard",
) -> Optional[Vehicle]:
    """
    Preserved backward-compatible signature. Assigns the primary truck for a route.
    """
    is_refrig = vehicle_type.lower() == "refrigerated"
    result = await match_vehicles(
        required_capacity_kg=required_capacity_kg,
        pickup_lat=pickup_lat,
        pickup_lng=pickup_lng,
        db=db,
        requires_refrigeration=is_refrig,
    )

    if result.status == "MATCHED" and result.vehicles:
        primary_id = result.vehicles[0].vehicle_id
        v_res = await db.execute(select(Vehicle).where(Vehicle.id == primary_id))
        return v_res.scalar_one_or_none()

    return None
