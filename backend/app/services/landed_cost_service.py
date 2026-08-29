"""
Landed Cost Service
Calculates: produce_cost + transport_cost + handling_cost + expected_loss
"""
import logging
from dataclasses import dataclass
from typing import List, Optional

logger = logging.getLogger(__name__)

# Configurable constants
HUB_HANDLING_COST_PER_KG = 0.50  # INR per kg hub handling
SPOILAGE_RATE_PER_HOUR = 0.005   # 0.5% per hour
MAX_TRANSPORT_TO_PRODUCE_RATIO = 0.5  # Flag if transport > 50% of produce value


@dataclass
class FarmerAllocation:
    """A single farmer's contribution to an order."""
    farmer_id: str
    quantity_kg: float
    price_per_kg: float
    distance_km: float  # from farmer to first aggregation point


@dataclass
class LandedCostBreakdown:
    produce_cost: float
    transport_cost: float
    handling_cost: float
    expected_loss: float
    total: float
    is_economically_viable: bool
    warning: Optional[str] = None


def calculate_landed_cost(
    allocations: List[FarmerAllocation],
    total_route_distance_km: float,
    operating_cost_per_km: float,
    transit_hours: float,
    uses_hub: bool = False,
    hub_handling_cost_per_kg: float = HUB_HANDLING_COST_PER_KG,
    spoilage_rate_per_hour: float = SPOILAGE_RATE_PER_HOUR,
) -> LandedCostBreakdown:
    """
    Calculate total landed cost for a fulfillment plan.

    Problems addressed:
    - #16: Different farmer prices → weighted produce_cost
    - #26: Transport cost > produce value → flag ECONOMICALLY_INFEASIBLE
    - #14: Spoilage estimation based on transit time
    """
    # Produce cost: sum of qty × price across all farmers.
    # price_per_kg may arrive as a Decimal (from a Numeric DB column), so coerce
    # to float to keep the whole computation in float space.
    produce_cost = sum(a.quantity_kg * float(a.price_per_kg) for a in allocations)

    # Transport cost: total route km × operating cost per km
    transport_cost = total_route_distance_km * operating_cost_per_km

    # Handling cost: only if hub is used
    total_qty = sum(a.quantity_kg for a in allocations)
    handling_cost = total_qty * hub_handling_cost_per_kg if uses_hub else 0.0

    # Expected loss: quantity × spoilage rate × transit hours
    expected_loss_kg = total_qty * spoilage_rate_per_hour * transit_hours
    # Monetary loss based on average price
    avg_price = produce_cost / total_qty if total_qty > 0 else 0
    expected_loss = expected_loss_kg * avg_price

    total = produce_cost + transport_cost + handling_cost + expected_loss

    # Economic viability check (Problem #26)
    is_viable = True
    warning = None
    if produce_cost > 0 and transport_cost > produce_cost * MAX_TRANSPORT_TO_PRODUCE_RATIO:
        is_viable = False
        warning = (
            f"Transport cost ({transport_cost:.2f}) exceeds "
            f"{MAX_TRANSPORT_TO_PRODUCE_RATIO * 100:.0f}% of produce cost ({produce_cost:.2f}). "
            f"Consider alternative sourcing."
        )

    return LandedCostBreakdown(
        produce_cost=round(produce_cost, 2),
        transport_cost=round(transport_cost, 2),
        handling_cost=round(handling_cost, 2),
        expected_loss=round(expected_loss, 2),
        total=round(total, 2),
        is_economically_viable=is_viable,
        warning=warning,
    )


def compare_plans(plans: List[LandedCostBreakdown]) -> int:
    """
    Compare multiple candidate plans and return the index of the cheapest viable one.
    If no viable plan exists, return the cheapest overall.
    """
    viable = [(i, p) for i, p in enumerate(plans) if p.is_economically_viable]
    if viable:
        return min(viable, key=lambda x: x[1].total)[0]
    # No viable plan — return cheapest anyway
    return min(range(len(plans)), key=lambda i: plans[i].total)
