"""
Landed Cost Service
Realistic logistics cost calculation considering:
- Produce Cost: sum(farmer_qty * farmer_price)
- Fuel Cost: distance_km * fuel_rate_per_km
- Driver Cost: distance_km * driver_rate_per_km
- Toll Charges: distance_km * toll_rate_per_km
- Loading/Unloading: total_kg * loading_rate_per_kg
- Hub Handling: total_kg * hub_handling_per_kg (if hub is used)
- Cold Chain: distance_km * cold_chain_rate_per_km + total_kg * cold_chain_handling
- Expected Spoilage: decay over transit time * produce value

Calculates:
- total_cost
- transportation_cost
- cost_per_kg
- cost_per_delivered_kg

Includes plan comparison selecting the lowest total landed cost.
"""
import logging
from dataclasses import dataclass
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

# Standard Logistics Cost Coefficients (INR)
DEFAULT_FUEL_RATE_PER_KM = 6.50           # INR/km diesel consumption
DEFAULT_DRIVER_RATE_PER_KM = 2.50         # INR/km driver bata & wages
DEFAULT_TOLL_RATE_PER_KM = 1.50           # INR/km highway toll estimate
DEFAULT_LOADING_COST_PER_KG = 0.30        # INR/kg farm loading and buyer unloading
DEFAULT_HUB_HANDLING_COST_PER_KG = 0.50   # INR/kg hub cross-docking intake & sorting
DEFAULT_COLD_CHAIN_PER_KM = 1.50          # INR/km refrigeration compressor fuel/maintenance
STANDARD_SPOILAGE_RATE_PER_HOUR = 0.005   # 0.5% per hour ambient transit
COLD_CHAIN_SPOILAGE_RATE_PER_HOUR = 0.001 # 0.1% per hour cold-chain transit
MAX_TRANSPORT_TO_PRODUCE_RATIO = 0.50     # Flag if transport exceeds 50% of produce value


@dataclass
class FarmerAllocation:
    """A single farmer's contribution to an order."""
    farmer_id: str
    quantity_kg: float
    price_per_kg: float
    distance_km: float = 0.0


@dataclass
class LandedCostBreakdown:
    produce_cost: float
    fuel_cost: float = 0.0
    driver_cost: float = 0.0
    toll_charges: float = 0.0
    loading_unloading_cost: float = 0.0
    hub_handling_cost: float = 0.0
    cold_chain_cost: float = 0.0
    expected_spoilage_cost: float = 0.0
    expected_spoilage_kg: float = 0.0
    transport_cost: float = 0.0
    handling_cost: float = 0.0
    expected_loss: float = 0.0
    total: float = 0.0
    cost_per_kg: float = 0.0
    cost_per_delivered_kg: float = 0.0
    is_economically_viable: bool = True
    warning: Optional[str] = None


def calculate_landed_cost(
    allocations: List[FarmerAllocation],
    total_route_distance_km: float,
    operating_cost_per_km: Optional[float] = None,
    transit_hours: float = 2.0,
    uses_hub: bool = False,
    hub_count: int = 1,
    requires_cold_chain: bool = False,
    fuel_rate_per_km: float = DEFAULT_FUEL_RATE_PER_KM,
    driver_rate_per_km: float = DEFAULT_DRIVER_RATE_PER_KM,
    toll_rate_per_km: float = DEFAULT_TOLL_RATE_PER_KM,
    loading_rate_per_kg: float = 0.0,
    hub_handling_cost_per_kg: float = DEFAULT_HUB_HANDLING_COST_PER_KG,
) -> LandedCostBreakdown:
    """
    Calculate realistic, multi-component landed cost for a fulfillment plan.
    """
    total_qty = sum(a.quantity_kg for a in allocations)
    if total_qty <= 0:
        return LandedCostBreakdown(
            produce_cost=0.0,
            transport_cost=0.0,
            handling_cost=0.0,
            expected_loss=0.0,
            total=0.0,
            is_economically_viable=False,
            warning="Total quantity must be greater than zero",
        )

    # 1. Produce Cost: sum(qty_i * price_i)
    produce_cost = sum(a.quantity_kg * float(a.price_per_kg) for a in allocations)
    avg_price_per_kg = produce_cost / total_qty

    # 2. Transportation Components
    if operating_cost_per_km is not None and operating_cost_per_km > 0:
        # If an explicit vehicle operating cost was given, proportionally split it
        fuel_cost = total_route_distance_km * (operating_cost_per_km * 0.55)
        driver_cost = total_route_distance_km * (operating_cost_per_km * 0.25)
        toll_charges = total_route_distance_km * (operating_cost_per_km * 0.20)
    else:
        fuel_cost = total_route_distance_km * fuel_rate_per_km
        driver_cost = total_route_distance_km * driver_rate_per_km
        toll_charges = total_route_distance_km * toll_rate_per_km

    # Cold chain cost (extra compressor power and temperature monitoring)
    cold_chain_cost = (
        total_route_distance_km * DEFAULT_COLD_CHAIN_PER_KM if requires_cold_chain else 0.0
    )

    transport_cost = fuel_cost + driver_cost + toll_charges + cold_chain_cost

    # 3. Handling Components
    # Loading at farm + unloading at buyer
    loading_unloading_cost = total_qty * loading_rate_per_kg

    # Hub handling (cross-docking / consolidation at local or regional hubs)
    hub_handling_cost = (
        total_qty * hub_handling_cost_per_kg * hub_count if uses_hub else 0.0
    )

    handling_cost = loading_unloading_cost + hub_handling_cost

    # 4. Expected Spoilage
    spoilage_rate = (
        COLD_CHAIN_SPOILAGE_RATE_PER_HOUR if requires_cold_chain else STANDARD_SPOILAGE_RATE_PER_HOUR
    )
    expected_spoilage_kg = total_qty * spoilage_rate * max(0.5, transit_hours)
    expected_spoilage_cost = expected_spoilage_kg * avg_price_per_kg
    expected_loss = expected_spoilage_cost  # Backward-compatible alias

    # 5. Total Landed Cost
    total = produce_cost + transport_cost + handling_cost + expected_spoilage_cost

    # 6. Delivered Metrics
    delivered_kg = max(0.1, total_qty - expected_spoilage_kg)
    cost_per_kg = round(total / total_qty, 2)
    cost_per_delivered_kg = round(total / delivered_kg, 2)

    # 7. Economic Viability Check
    is_viable = True
    warning = None
    if produce_cost > 0 and transport_cost > produce_cost * MAX_TRANSPORT_TO_PRODUCE_RATIO:
        is_viable = False
        warning = (
            f"Transport cost (₹{transport_cost:.0f}) exceeds {MAX_TRANSPORT_TO_PRODUCE_RATIO*100:.0f}% "
            f"of produce value (₹{produce_cost:.0f}). Sourcing route is economically unfavorable."
        )

    return LandedCostBreakdown(
        produce_cost=round(produce_cost, 2),
        fuel_cost=round(fuel_cost, 2),
        driver_cost=round(driver_rate_per_km * total_route_distance_km, 2) if operating_cost_per_km is None else round(driver_cost, 2),
        toll_charges=round(toll_rate_per_km * total_route_distance_km, 2) if operating_cost_per_km is None else round(toll_charges, 2),
        loading_unloading_cost=round(loading_unloading_cost, 2),
        hub_handling_cost=round(hub_handling_cost, 2),
        cold_chain_cost=round(cold_chain_cost, 2),
        expected_spoilage_cost=round(expected_spoilage_cost, 2),
        expected_spoilage_kg=round(expected_spoilage_kg, 2),
        transport_cost=round(transport_cost, 2),
        handling_cost=round(handling_cost, 2),
        expected_loss=round(expected_loss, 2),
        total=round(total, 2),
        cost_per_kg=cost_per_kg,
        cost_per_delivered_kg=cost_per_delivered_kg,
        is_economically_viable=is_viable,
        warning=warning,
    )


@dataclass
class PlanCandidate:
    plan_name: str
    distance_km: float
    landed_cost: LandedCostBreakdown
    routing_mode: str
    metadata: Dict[str, Any] = None


def select_cheapest_viable_plan(candidates: List[PlanCandidate]) -> PlanCandidate:
    """
    Compares candidate shipment plans economically and selects the one
    with the lowest total landed cost.

    Example:
      Plan A: Distance 210 km, Cost ₹8,500
      Plan B: Distance 240 km, Cost ₹7,600
      -> Selects Plan B because total landed cost is lower.
    """
    if not candidates:
        raise ValueError("Cannot compare empty candidate plans list")

    viable = [p for p in candidates if p.landed_cost.is_economically_viable]
    if viable:
        return min(viable, key=lambda p: p.landed_cost.total)
    # If none are strictly viable, select the lowest total cost overall
    return min(candidates, key=lambda p: p.landed_cost.total)


def compare_plans(plans: List[LandedCostBreakdown]) -> int:
    """Backward-compatible index-based comparator."""
    viable = [(i, p) for i, p in enumerate(plans) if p.is_economically_viable]
    if viable:
        return min(viable, key=lambda x: x[1].total)[0]
    return min(range(len(plans)), key=lambda i: plans[i].total)
