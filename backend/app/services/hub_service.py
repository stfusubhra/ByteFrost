"""
Hub Routing & Capacity Management Service
Decides: Direct (Farmer -> Buyer) vs Local Hub (Farmer -> Hub -> Buyer) vs Regional Hub (Farmer -> Local Hub -> Regional Hub -> Buyer)

Criteria Evaluated:
- Distance & transportation cost (INR 12/km)
- Hub handling cost (INR 0.50/kg per hub)
- Loading/unloading transfer delays (1.5 hrs per hub)
- Travel time (assumed 40 km/h rural road network)
- Freshness constraints (produce shelf-life)
- Buyer delivery deadlines
- Hub capacity constraints (Total, Occupied, Reserved, Available, Incoming, Outgoing)

Rules:
- Hubs are NOT mandatory. Direct delivery is preferred whenever it is cheaper,
  faster, or when hubs exceed deadlines/spoilage limits.
- Never assign produce to a hub that cannot accommodate it.
"""
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Hub, HubStatus, RouteStop, Shipment, StopType
from app.services.maps_service import haversine

logger = logging.getLogger(__name__)

HUB_SEARCH_RADIUS_KM = 150.0
HUB_HANDLING_COST_PER_KG = 0.50
TRANSPORT_COST_PER_KM = 12.0  # INR/km average
AVERAGE_SPEED_KMH = 40.0      # km/h
HUB_TRANSFER_DELAY_HOURS = 1.5  # Loading/unloading and sorting delay per hub


@dataclass
class HubCapacityStatus:
    hub_id: UUID
    hub_name: str
    hub_type: str
    total_capacity_kg: float
    occupied_capacity_kg: float
    reserved_capacity_kg: float
    available_capacity_kg: float
    incoming_quantity_kg: float
    outgoing_quantity_kg: float
    utilization_pct: float
    can_accommodate: bool


@dataclass
class HubCandidate:
    hub_id: UUID
    name: str
    hub_type: str
    latitude: float
    longitude: float
    capacity_kg: float
    occupied_kg: float
    reserved_kg: float
    available_kg: float
    distance_to_centroid_km: float


@dataclass
class HubRoutingDecision:
    mode: str  # "direct" / "hub" / "multi_hub"
    local_hub: Optional[HubCandidate] = None
    regional_hub: Optional[HubCandidate] = None
    direct_cost_estimate: float = 0.0
    hub_cost_estimate: float = 0.0
    multi_hub_cost_estimate: float = 0.0
    direct_duration_hours: float = 0.0
    hub_duration_hours: float = 0.0
    multi_hub_duration_hours: float = 0.0
    is_direct_feasible: bool = True
    is_hub_feasible: bool = True
    is_multi_hub_feasible: bool = True
    reason: str = ""


async def get_hub_capacity_status(
    hub: Hub,
    requested_kg: float = 0.0,
    db: Optional[AsyncSession] = None,
) -> HubCapacityStatus:
    """
    Computes exact capacity breakdown for a hub:
    - total_capacity_kg: physical ceiling
    - occupied_capacity_kg: currently physically stored
    - reserved_capacity_kg: reserved for incoming shipments in transit
    - available_capacity_kg: total - occupied - reserved
    - incoming_quantity_kg: active deliveries heading to this hub
    - outgoing_quantity_kg: active deliveries departing from this hub
    """
    total = float(hub.capacity_kg)
    occupied = float(hub.current_load_kg or 0.0)
    reserved = 0.0
    incoming = 0.0
    outgoing = 0.0

    if db is not None:
        try:
            # Query incoming active shipments passing through this hub
            inc_stmt = (
                select(func.coalesce(func.sum(RouteStop.quantity_kg), 0.0))
                .join(Shipment, RouteStop.route_id == Shipment.route_id)
                .where(
                    and_(
                        RouteStop.hub_id == hub.id,
                        RouteStop.stop_type == StopType.HUB,
                        Shipment.status.in_(["pending", "dispatched", "in_transit"]),
                    )
                )
            )
            inc_res = await db.execute(inc_stmt)
            incoming = float(inc_res.scalar() or 0.0)
            reserved = incoming  # Incoming in-transit shipments hold reservation
        except Exception as e:
            logger.warning(f"Could not compute dynamic reservations for hub {hub.id}: {e}")

    available = max(0.0, total - occupied - reserved)
    utilization = round(((occupied + reserved) / total * 100.0), 1) if total > 0 else 100.0

    return HubCapacityStatus(
        hub_id=hub.id,
        hub_name=hub.name,
        hub_type=hub.hub_type.value if hasattr(hub.hub_type, "value") else str(hub.hub_type),
        total_capacity_kg=round(total, 2),
        occupied_capacity_kg=round(occupied, 2),
        reserved_capacity_kg=round(reserved, 2),
        available_capacity_kg=round(available, 2),
        incoming_quantity_kg=round(incoming, 2),
        outgoing_quantity_kg=round(outgoing, 2),
        utilization_pct=utilization,
        can_accommodate=available >= requested_kg,
    )


def evaluate_hub_routing(
    farmer_locations: List[dict],
    buyer_lat: float,
    buyer_lng: float,
    total_kg: float,
    candidate_hubs: List[HubCandidate],
    delivery_deadline: Optional[datetime] = None,
    max_freshness_hours: Optional[float] = 48.0,
    now: Optional[datetime] = None,
) -> HubRoutingDecision:
    """
    Pure algorithmic decision maker comparing:
      1. Direct: Farmer -> Buyer
      2. Local Hub: Farmer -> Hub -> Buyer
      3. Regional Hub: Farmer -> Local Hub -> Regional Hub -> Buyer

    Considers:
      - Distance & Transportation cost
      - Hub handling cost & capacity
      - Transfer delays (loading/unloading)
      - Travel time
      - Freshness limits
      - Buyer deadlines
    """
    if not farmer_locations:
        return HubRoutingDecision(mode="direct", reason="No farmers to route")

    current_time = now or datetime.now(timezone.utc)
    max_deadline_hours = float("inf")
    if delivery_deadline:
        d_time = delivery_deadline if delivery_deadline.tzinfo else delivery_deadline.replace(tzinfo=timezone.utc)
        delta = (d_time - current_time).total_seconds() / 3600.0
        max_deadline_hours = max(0.5, delta)

    freshness_limit_hours = max_freshness_hours or 48.0

    # Centroid of farmer pickup cluster
    centroid_lat = sum(f["lat"] for f in farmer_locations) / len(farmer_locations)
    centroid_lng = sum(f["lng"] for f in farmer_locations) / len(farmer_locations)

    # -------------------------------------------------------------
    # 1. DIRECT MODE EVALUATION
    # -------------------------------------------------------------
    # Direct distance: sum of farmer pickups to centroid + centroid to buyer
    farmers_internal_dist = sum(
        haversine(f["lat"], f["lng"], centroid_lat, centroid_lng)
        for f in farmer_locations
    )
    centroid_to_buyer = haversine(centroid_lat, centroid_lng, buyer_lat, buyer_lng)
    direct_dist = farmers_internal_dist + centroid_to_buyer
    direct_travel_hours = direct_dist / AVERAGE_SPEED_KMH
    direct_handling_delay = 0.0  # Direct delivery has no warehouse delay
    direct_total_duration = round(direct_travel_hours + direct_handling_delay, 2)
    direct_cost = round(direct_dist * TRANSPORT_COST_PER_KM, 2)

    is_direct_feasible = (
        direct_total_duration <= max_deadline_hours and
        direct_total_duration <= freshness_limit_hours
    )

    # -------------------------------------------------------------
    # FILTER CANDIDATE HUBS BY CAPACITY
    # -------------------------------------------------------------
    # Never assign produce to a hub that cannot accommodate it
    eligible_local_hubs = [
        h for h in candidate_hubs
        if h.hub_type.lower() == "local" and h.available_kg >= total_kg
    ]
    eligible_local_hubs.sort(key=lambda h: h.distance_to_centroid_km)

    eligible_regional_hubs = [
        h for h in candidate_hubs
        if h.hub_type.lower() == "regional" and h.available_kg >= total_kg
    ]
    eligible_regional_hubs.sort(key=lambda h: h.distance_to_centroid_km)

    # -------------------------------------------------------------
    # 2. LOCAL HUB MODE EVALUATION (Farmer -> Local Hub -> Buyer)
    # -------------------------------------------------------------
    hub_cost = float("inf")
    hub_total_duration = float("inf")
    is_hub_feasible = False
    selected_local: Optional[HubCandidate] = None

    if eligible_local_hubs:
        selected_local = eligible_local_hubs[0]
        farmers_to_hub = sum(
            haversine(f["lat"], f["lng"], selected_local.latitude, selected_local.longitude)
            for f in farmer_locations
        )
        hub_to_buyer = haversine(
            selected_local.latitude, selected_local.longitude,
            buyer_lat, buyer_lng,
        )
        total_hub_dist = farmers_to_hub + hub_to_buyer
        hub_travel_hours = total_hub_dist / AVERAGE_SPEED_KMH
        hub_handling_delay = HUB_TRANSFER_DELAY_HOURS
        hub_total_duration = round(hub_travel_hours + hub_handling_delay, 2)

        handling_cost = total_kg * HUB_HANDLING_COST_PER_KG
        hub_cost = round(total_hub_dist * TRANSPORT_COST_PER_KM + handling_cost, 2)

        is_hub_feasible = (
            hub_total_duration <= max_deadline_hours and
            hub_total_duration <= freshness_limit_hours
        )

    # -------------------------------------------------------------
    # 3. REGIONAL HUB MODE EVALUATION (Farmer -> Local -> Regional -> Buyer)
    # -------------------------------------------------------------
    multi_hub_cost = float("inf")
    multi_hub_total_duration = float("inf")
    is_multi_hub_feasible = False
    selected_regional: Optional[HubCandidate] = None

    if selected_local and eligible_regional_hubs:
        selected_regional = eligible_regional_hubs[0]
        farmers_to_local = sum(
            haversine(f["lat"], f["lng"], selected_local.latitude, selected_local.longitude)
            for f in farmer_locations
        )
        local_to_regional = haversine(
            selected_local.latitude, selected_local.longitude,
            selected_regional.latitude, selected_regional.longitude,
        )
        regional_to_buyer = haversine(
            selected_regional.latitude, selected_regional.longitude,
            buyer_lat, buyer_lng,
        )
        total_multi_dist = farmers_to_local + local_to_regional + regional_to_buyer
        multi_travel_hours = total_multi_dist / AVERAGE_SPEED_KMH
        multi_handling_delay = HUB_TRANSFER_DELAY_HOURS * 2.0  # Two hub transfer points
        multi_hub_total_duration = round(multi_travel_hours + multi_handling_delay, 2)

        handling_cost = total_kg * HUB_HANDLING_COST_PER_KG * 2.0
        multi_hub_cost = round(total_multi_dist * TRANSPORT_COST_PER_KM + handling_cost, 2)

        is_multi_hub_feasible = (
            multi_hub_total_duration <= max_deadline_hours and
            multi_hub_total_duration <= freshness_limit_hours
        )

    # -------------------------------------------------------------
    # 4. DECISION LOGIC: Economically Sensible & Feasible Selection
    # -------------------------------------------------------------
    # Hubs are NOT mandatory. Choose hub only if feasible and cheaper.
    valid_modes = {}
    if is_direct_feasible:
        valid_modes["direct"] = direct_cost
    if is_hub_feasible and hub_cost != float("inf"):
        valid_modes["hub"] = hub_cost
    if is_multi_hub_feasible and multi_hub_cost != float("inf"):
        valid_modes["multi_hub"] = multi_hub_cost

    if not valid_modes:
        # Fallback to direct with warning if all exceed constraints
        return HubRoutingDecision(
            mode="direct",
            direct_cost_estimate=direct_cost,
            hub_cost_estimate=hub_cost if hub_cost != float("inf") else 0.0,
            multi_hub_cost_estimate=multi_hub_cost if multi_hub_cost != float("inf") else 0.0,
            direct_duration_hours=direct_total_duration,
            hub_duration_hours=hub_total_duration if hub_total_duration != float("inf") else 0.0,
            multi_hub_duration_hours=multi_hub_total_duration if multi_hub_total_duration != float("inf") else 0.0,
            is_direct_feasible=is_direct_feasible,
            is_hub_feasible=is_hub_feasible,
            is_multi_hub_feasible=is_multi_hub_feasible,
            reason="All hub modes violate deadline, freshness, or capacity limits; using direct routing.",
        )

    # Pick mode with the lowest cost among feasible ones
    best_mode = min(valid_modes, key=valid_modes.get)

    reasons = {
        "direct": f"Direct delivery selected (₹{direct_cost:.0f}) — fastest travel time ({direct_total_duration:.1f}h) without hub handling fees.",
        "hub": f"Local Hub '{selected_local.name if selected_local else 'Hub'}' selected (₹{hub_cost:.0f}) — lower consolidated transportation cost.",
        "multi_hub": f"Multi-Hub routing selected (₹{multi_hub_cost:.0f}) — long-distance regional consolidation is most economical.",
    }

    return HubRoutingDecision(
        mode=best_mode,
        local_hub=selected_local if best_mode in ("hub", "multi_hub") else None,
        regional_hub=selected_regional if best_mode == "multi_hub" else None,
        direct_cost_estimate=direct_cost,
        hub_cost_estimate=hub_cost if hub_cost != float("inf") else 0.0,
        multi_hub_cost_estimate=multi_hub_cost if multi_hub_cost != float("inf") else 0.0,
        direct_duration_hours=direct_total_duration,
        hub_duration_hours=hub_total_duration if hub_total_duration != float("inf") else 0.0,
        multi_hub_duration_hours=multi_hub_total_duration if multi_hub_total_duration != float("inf") else 0.0,
        is_direct_feasible=is_direct_feasible,
        is_hub_feasible=is_hub_feasible,
        is_multi_hub_feasible=is_multi_hub_feasible,
        reason=reasons[best_mode],
    )


async def decide_routing_mode(
    farmer_locations: List[dict],
    buyer_lat: float,
    buyer_lng: float,
    total_kg: float,
    db: AsyncSession,
    delivery_deadline: Optional[datetime] = None,
    max_freshness_hours: Optional[float] = 48.0,
) -> HubRoutingDecision:
    """
    Database-backed routing mode decision. Loads active hubs and evaluates capacity.
    """
    if not farmer_locations:
        return HubRoutingDecision(mode="direct", reason="No farmers to route")

    centroid_lat = sum(f["lat"] for f in farmer_locations) / len(farmer_locations)
    centroid_lng = sum(f["lng"] for f in farmer_locations) / len(farmer_locations)

    stmt = select(Hub).where(Hub.status == HubStatus.ACTIVE)
    result = await db.execute(stmt)
    all_hubs = result.scalars().all()

    candidate_hubs: List[HubCandidate] = []
    for hub in all_hubs:
        dist = haversine(centroid_lat, centroid_lng, hub.latitude, hub.longitude)
        if dist <= HUB_SEARCH_RADIUS_KM:
            cap_status = await get_hub_capacity_status(hub, requested_kg=total_kg, db=db)
            candidate_hubs.append(
                HubCandidate(
                    hub_id=hub.id,
                    name=hub.name,
                    hub_type=cap_status.hub_type,
                    latitude=hub.latitude,
                    longitude=hub.longitude,
                    capacity_kg=cap_status.total_capacity_kg,
                    occupied_kg=cap_status.occupied_capacity_kg,
                    reserved_kg=cap_status.reserved_capacity_kg,
                    available_kg=cap_status.available_capacity_kg,
                    distance_to_centroid_km=round(dist, 2),
                )
            )

    return evaluate_hub_routing(
        farmer_locations=farmer_locations,
        buyer_lat=buyer_lat,
        buyer_lng=buyer_lng,
        total_kg=total_kg,
        candidate_hubs=candidate_hubs,
        delivery_deadline=delivery_deadline,
        max_freshness_hours=max_freshness_hours,
    )
