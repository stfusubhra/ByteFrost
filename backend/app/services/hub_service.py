"""
Hub Routing Service
Decides: Direct (Mode A) vs Local Hub (Mode B) vs Multi-Hub (Mode C)

Problems addressed:
- #7:  Hub farther than direct → pick Mode A
- #8:  Hub insufficient storage → redirect
- #9:  Hub overloaded → dynamic load balancing
- #28: Hub-to-hub unnecessary → compare Mode B vs C
- #29: No nearby hub → force Mode A
"""
import logging
from dataclasses import dataclass, field
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Hub, HubStatus
from app.services.maps_service import haversine

logger = logging.getLogger(__name__)

HUB_SEARCH_RADIUS_KM = 100.0
HUB_HANDLING_COST_PER_KG = 0.50
TRANSPORT_COST_PER_KM = 12.0  # INR/km average


@dataclass
class HubCandidate:
    hub_id: UUID
    name: str
    hub_type: str
    latitude: float
    longitude: float
    capacity_kg: float
    current_load_kg: float
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
    reason: str = ""


async def decide_routing_mode(
    farmer_locations: List[dict],  # [{lat, lng, quantity_kg}]
    buyer_lat: float,
    buyer_lng: float,
    total_kg: float,
    db: AsyncSession,
) -> HubRoutingDecision:
    """
    Decide the optimal routing mode based on cost comparison.
    """
    if not farmer_locations:
        return HubRoutingDecision(mode="direct", reason="No farmers to route")

    # Compute farmer cluster centroid
    centroid_lat = sum(f["lat"] for f in farmer_locations) / len(farmer_locations)
    centroid_lng = sum(f["lng"] for f in farmer_locations) / len(farmer_locations)

    # Mode A: Direct cost estimate
    direct_distance = sum(
        haversine(f["lat"], f["lng"], buyer_lat, buyer_lng)
        for f in farmer_locations
    )
    direct_cost = direct_distance * TRANSPORT_COST_PER_KM

    # Find nearby hubs
    stmt = select(Hub).where(Hub.status == HubStatus.ACTIVE)
    result = await db.execute(stmt)
    all_hubs = result.scalars().all()

    local_hubs = []
    regional_hubs = []
    for hub in all_hubs:
        dist = haversine(centroid_lat, centroid_lng, hub.latitude, hub.longitude)
        if dist <= HUB_SEARCH_RADIUS_KM:
            candidate = HubCandidate(
                hub_id=hub.id,
                name=hub.name,
                hub_type=hub.hub_type.value if hub.hub_type else "local",
                latitude=hub.latitude,
                longitude=hub.longitude,
                capacity_kg=hub.capacity_kg,
                current_load_kg=hub.current_load_kg,
                available_kg=hub.capacity_kg - hub.current_load_kg,
                distance_to_centroid_km=round(dist, 2),
            )
            if hub.hub_type and hub.hub_type.value == "regional":
                regional_hubs.append(candidate)
            else:
                local_hubs.append(candidate)

    # No hub nearby → Mode A (Problem #29)
    if not local_hubs and not regional_hubs:
        return HubRoutingDecision(
            mode="direct",
            direct_cost_estimate=round(direct_cost, 2),
            reason="No hubs within search radius — using direct routing",
        )

    # Find best local hub with capacity (Problem #8, #9)
    local_hubs.sort(key=lambda h: h.distance_to_centroid_km)
    selected_local = None
    for hub in local_hubs:
        if hub.available_kg >= total_kg:
            selected_local = hub
            break
        else:
            logger.info(
                f"Hub {hub.name} capacity insufficient "
                f"({hub.available_kg:.0f} kg < {total_kg:.0f} kg), trying next"
            )

    # Mode B: Farmers → Local Hub → Buyer
    hub_cost = float("inf")
    if selected_local:
        farmers_to_hub = sum(
            haversine(f["lat"], f["lng"], selected_local.latitude, selected_local.longitude)
            for f in farmer_locations
        )
        hub_to_buyer = haversine(
            selected_local.latitude, selected_local.longitude,
            buyer_lat, buyer_lng,
        )
        handling = total_kg * HUB_HANDLING_COST_PER_KG
        hub_cost = (farmers_to_hub + hub_to_buyer) * TRANSPORT_COST_PER_KM + handling

    # Mode C: Farmers → Local Hub → Regional Hub → Buyer (Problem #28)
    multi_hub_cost = float("inf")
    selected_regional = None
    if selected_local and regional_hubs:
        regional_hubs.sort(key=lambda h: h.distance_to_centroid_km)
        for rh in regional_hubs:
            if rh.available_kg >= total_kg:
                selected_regional = rh
                break

        if selected_regional:
            hub_to_regional = haversine(
                selected_local.latitude, selected_local.longitude,
                selected_regional.latitude, selected_regional.longitude,
            )
            regional_to_buyer = haversine(
                selected_regional.latitude, selected_regional.longitude,
                buyer_lat, buyer_lng,
            )
            farmers_to_hub = sum(
                haversine(f["lat"], f["lng"], selected_local.latitude, selected_local.longitude)
                for f in farmer_locations
            )
            multi_hub_cost = (
                (farmers_to_hub + hub_to_regional + regional_to_buyer) * TRANSPORT_COST_PER_KM
                + total_kg * HUB_HANDLING_COST_PER_KG * 2  # Double handling
            )

    # Compare costs and pick cheapest (Problem #7)
    costs = {
        "direct": direct_cost,
        "hub": hub_cost,
        "multi_hub": multi_hub_cost,
    }
    best_mode = min(costs, key=costs.get)

    decision = HubRoutingDecision(
        mode=best_mode,
        local_hub=selected_local if best_mode in ("hub", "multi_hub") else None,
        regional_hub=selected_regional if best_mode == "multi_hub" else None,
        direct_cost_estimate=round(direct_cost, 2),
        hub_cost_estimate=round(hub_cost, 2) if hub_cost != float("inf") else 0.0,
        multi_hub_cost_estimate=round(multi_hub_cost, 2) if multi_hub_cost != float("inf") else 0.0,
        reason=f"Mode '{best_mode}' selected — lowest estimated cost: {costs[best_mode]:.2f}",
    )

    return decision
