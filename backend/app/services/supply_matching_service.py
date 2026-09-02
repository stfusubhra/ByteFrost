"""
Supply Matching Service — Stage 1
Finds the best combination of farmers to fulfill a buyer's order and allocates quantities.

Algorithm:
1. Query active ProduceListing matching crop (case-insensitive) + quality
2. Verify availability dates against delivery deadlines
3. Score each listing multi-dimensionally:
   - Available quantity fit
   - Distance from delivery point
   - Produce quality grade
   - Freshness (days since harvest)
   - Price competitiveness
   - Farmer reliability history
   - Estimated transportation cost
4. Multi-farmer aggregation: greedy selection across expanding radius steps (100km -> 500km)
5. Strict economic feasibility check (transport cost vs produce value)
6. Quantity allocation determining each farmer's exact contribution
7. Feasibility assessment:
   - FEASIBLE: full quantity matched
   - PARTIAL: feasible partial quantity matched with accurate shortage tracking
   - INFEASIBLE: no feasible supply found
"""
import logging
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import ProduceListing, FarmerReliabilityScore, User
from app.services.maps_service import haversine

logger = logging.getLogger(__name__)

# Multi-criteria scoring weights
WEIGHT_DISTANCE = 0.25
WEIGHT_QUANTITY = 0.20
WEIGHT_QUALITY = 0.20
WEIGHT_FRESHNESS = 0.15
WEIGHT_PRICE = 0.10
WEIGHT_RELIABILITY = 0.10

QUALITY_GRADE_MAP = {"A": 1.0, "B": 0.7, "C": 0.4}
INITIAL_RADIUS_KM = 100.0
RADIUS_STEP_KM = 50.0
MAX_RADIUS_KM = 500.0
MAX_TRANSPORT_RATIO = 0.30  # Skip farmer if transport > 30% of produce value
BASE_TRANSPORT_COST_PER_KM = 12.0  # INR/km estimate


@dataclass
class MatchedFarmer:
    listing_id: UUID
    farmer_id: UUID
    farmer_name: str
    crop_name: str
    available_kg: float
    allocated_kg: float
    price_per_kg: float
    quality_grade: str
    distance_km: float
    latitude: float
    longitude: float
    score: float
    reliability_score: float
    estimated_transport_cost: float = 0.0
    explanation: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SupplyMatchResult:
    status: str  # FEASIBLE / PARTIAL / INFEASIBLE
    matched_farmers: List[MatchedFarmer] = field(default_factory=list)
    total_matched_kg: float = 0.0
    required_kg: float = 0.0
    shortage_kg: float = 0.0
    infeasibility_reason: Optional[str] = None


def allocate_supply_from_candidates(
    scored_candidates: List[MatchedFarmer],
    required_kg: float,
    initial_radius_km: float = INITIAL_RADIUS_KM,
    max_radius_km: float = MAX_RADIUS_KM,
    radius_step_km: float = RADIUS_STEP_KM,
    max_transport_ratio: float = MAX_TRANSPORT_RATIO,
) -> SupplyMatchResult:
    """
    Greedy selection and quantity allocation with progressive radius expansion.
    Can be run purely in-memory for testing or during live matching.
    """
    if not scored_candidates or required_kg <= 0:
        return SupplyMatchResult(
            status="INFEASIBLE",
            matched_farmers=[],
            total_matched_kg=0.0,
            required_kg=required_kg,
            shortage_kg=required_kg,
            infeasibility_reason="No scored candidates available or invalid requirement",
        )

    current_radius = initial_radius_km
    matched: List[MatchedFarmer] = []
    remaining = required_kg

    while remaining > 0 and current_radius <= max_radius_km:
        # Filter by current radius and only consider candidates not yet allocated
        candidates_in_radius = [
            c for c in scored_candidates
            if c.distance_km <= current_radius and c.allocated_kg == 0
        ]
        # Rank by composite score (highest first)
        candidates_in_radius.sort(key=lambda c: c.score, reverse=True)

        for candidate in candidates_in_radius:
            if remaining <= 0:
                break

            # Economic feasibility check for distant farmers (Problem #3)
            if candidate.distance_km > initial_radius_km:
                est_transport = candidate.distance_km * BASE_TRANSPORT_COST_PER_KM
                potential_alloc = min(candidate.available_kg, remaining)
                est_produce_value = candidate.price_per_kg * potential_alloc
                if est_produce_value > 0 and est_transport > est_produce_value * max_transport_ratio:
                    logger.info(
                        f"Skipping distant farmer {candidate.farmer_id} "
                        f"(transport {est_transport:.0f} > {max_transport_ratio*100}% "
                        f"of produce {est_produce_value:.0f})"
                    )
                    continue

            # Allocate quantity from this farmer
            alloc = min(candidate.available_kg, remaining)
            candidate.allocated_kg = round(alloc, 2)
            remaining -= alloc
            matched.append(candidate)

        if remaining > 0:
            current_radius += radius_step_km
        else:
            break

    total_matched = sum(m.allocated_kg for m in matched)

    if remaining <= 0:
        status = "FEASIBLE"
    elif total_matched > 0:
        status = "PARTIAL"
    else:
        status = "INFEASIBLE"

    return SupplyMatchResult(
        status=status,
        matched_farmers=matched,
        total_matched_kg=round(total_matched, 2),
        required_kg=round(required_kg, 2),
        shortage_kg=round(max(0.0, remaining), 2),
        infeasibility_reason=(
            f"Only {total_matched:.0f} kg available within {max_radius_km} km radius "
            f"(needed {required_kg:.0f} kg)"
        ) if status != "FEASIBLE" else None,
    )


async def match_supply(
    crop_name: str,
    required_kg: float,
    delivery_lat: float,
    delivery_lng: float,
    min_quality_grade: str = "B",
    max_price_per_kg: Optional[float] = None,
    delivery_deadline: Optional[datetime] = None,
    db: Optional[AsyncSession] = None,
) -> SupplyMatchResult:
    """
    Find the best farmer combination for a buyer's order and allocate quantities.

    Evaluates:
    - Available quantity
    - Distance (Haversine)
    - Produce type (case-insensitive)
    - Produce quality (min quality grade threshold)
    - Price (vs market average, capped at max_price_per_kg)
    - Availability dates
    - Reliability score
    - Freshness (days since harvest)
    - Transportation cost
    """
    if db is None:
        raise ValueError("Database session required for match_supply")

    min_quality_value = QUALITY_GRADE_MAP.get(min_quality_grade, 0.0)
    cleaned_crop = crop_name.strip()

    # Query all active listings for this crop (case-insensitive)
    stmt = select(ProduceListing, User).join(
        User, ProduceListing.seller_id == User.id
    ).where(
        and_(
            func.lower(func.trim(ProduceListing.crop_name)) == func.lower(cleaned_crop),
            ProduceListing.is_active == True,
            ProduceListing.quantity_kg > 0,
        )
    )
    result = await db.execute(stmt)
    listings_with_users = result.all()

    if not listings_with_users:
        return SupplyMatchResult(
            status="INFEASIBLE",
            required_kg=required_kg,
            shortage_kg=required_kg,
            infeasibility_reason=f"No active listings found for crop '{cleaned_crop}'",
        )

    # Get reliability scores for all farmers in batch
    farmer_ids = [u.id for _, u in listings_with_users]
    reliability_stmt = select(FarmerReliabilityScore).where(
        FarmerReliabilityScore.farmer_id.in_(farmer_ids)
    )
    reliability_result = await db.execute(reliability_stmt)
    reliability_map = {
        r.farmer_id: r.reliability_score
        for r in reliability_result.scalars().all()
    }

    # Compute average price for price scoring
    prices = [float(l.price_per_kg) for l, _ in listings_with_users if l.price_per_kg]
    avg_price = sum(prices) / len(prices) if prices else 1.0

    now_utc = datetime.now(timezone.utc)
    target_deadline = (
        delivery_deadline.replace(tzinfo=timezone.utc)
        if delivery_deadline and delivery_deadline.tzinfo is None
        else (delivery_deadline or now_utc)
    )

    # Score candidates
    scored_candidates = []
    for listing, user in listings_with_users:
        # Quality filter
        quality_val = QUALITY_GRADE_MAP.get(listing.quality_grade or "C", 0.4)
        if quality_val < min_quality_value:
            continue

        # Price filter
        if max_price_per_kg and listing.price_per_kg and float(listing.price_per_kg) > max_price_per_kg:
            continue

        # Availability filter (check availability windows)
        if listing.availability_start:
            avail_start = (
                listing.availability_start.replace(tzinfo=timezone.utc)
                if listing.availability_start.tzinfo is None
                else listing.availability_start
            )
            if avail_start > target_deadline:
                continue

        if listing.availability_end:
            avail_end = (
                listing.availability_end.replace(tzinfo=timezone.utc)
                if listing.availability_end.tzinfo is None
                else listing.availability_end
            )
            if avail_end < now_utc:
                continue

        # Compute distance
        farmer_lat = listing.pickup_latitude or user.latitude or 0.0
        farmer_lng = listing.pickup_longitude or user.longitude or 0.0
        if farmer_lat == 0.0 and farmer_lng == 0.0:
            continue  # No location coordinates available

        dist = haversine(farmer_lat, farmer_lng, delivery_lat, delivery_lng)

        # Multi-factor score components
        distance_score = 1.0 / (1.0 + dist / 100.0)
        quantity_fit = min(listing.quantity_kg, required_kg) / required_kg if required_kg > 0 else 1.0
        quality_score = quality_val

        # Freshness score (2-week shelf decay window)
        freshness_score = 1.0
        if listing.harvest_date:
            h_date = (
                listing.harvest_date.replace(tzinfo=timezone.utc)
                if listing.harvest_date.tzinfo is None
                else listing.harvest_date
            )
            days_since = (now_utc - h_date).days
            freshness_score = max(0.0, 1.0 - days_since / 14.0)

        price_val = float(listing.price_per_kg) if listing.price_per_kg else avg_price
        price_score = 1.0 / (1.0 + price_val / avg_price) if avg_price > 0 else 0.5
        reliability = reliability_map.get(user.id, 0.7)

        # Estimated transport cost (~12 INR/km)
        est_transport_cost = round(dist * BASE_TRANSPORT_COST_PER_KM, 2)

        composite = (
            WEIGHT_DISTANCE * distance_score
            + WEIGHT_QUANTITY * quantity_fit
            + WEIGHT_QUALITY * quality_score
            + WEIGHT_FRESHNESS * freshness_score
            + WEIGHT_PRICE * price_score
            + WEIGHT_RELIABILITY * reliability
        )

        explanation = {
            "distance_km": round(dist, 1),
            "distance_score": round(distance_score, 3),
            "quantity_fit": round(quantity_fit, 3),
            "quality_score": round(quality_score, 3),
            "freshness_score": round(freshness_score, 3),
            "price_score": round(price_score, 3),
            "reliability_score": round(reliability, 3),
            "transport_cost_est": est_transport_cost,
        }

        scored_candidates.append(MatchedFarmer(
            listing_id=listing.id,
            farmer_id=user.id,
            farmer_name=user.full_name or "Farmer",
            crop_name=listing.crop_name,
            available_kg=float(listing.quantity_kg),
            allocated_kg=0.0,
            price_per_kg=price_val,
            quality_grade=listing.quality_grade or "C",
            distance_km=round(dist, 2),
            latitude=farmer_lat,
            longitude=farmer_lng,
            score=round(composite, 4),
            reliability_score=reliability,
            estimated_transport_cost=est_transport_cost,
            explanation=explanation,
        ))

    if not scored_candidates:
        return SupplyMatchResult(
            status="INFEASIBLE",
            required_kg=required_kg,
            shortage_kg=required_kg,
            infeasibility_reason=f"No listings match quality/price/availability criteria for '{cleaned_crop}'",
        )

    # Perform greedy allocation across expanding radius steps
    return allocate_supply_from_candidates(
        scored_candidates=scored_candidates,
        required_kg=required_kg,
    )
