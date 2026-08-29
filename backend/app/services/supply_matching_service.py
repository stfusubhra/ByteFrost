"""
Supply Matching Service — Stage 1
Finds the best combination of farmers to fulfill a buyer's order.

Algorithm:
1. Query active ProduceListing matching crop + quality
2. Score each listing (distance, quantity, quality, freshness, price, reliability)
3. Greedy selection until quantity covered
4. If gap: expand search radius by 50 km steps
5. Economic check per distant farmer
6. Return FEASIBLE / PARTIAL / INFEASIBLE
"""
import logging
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import ProduceListing, FarmerReliabilityScore, User
from app.services.maps_service import haversine

logger = logging.getLogger(__name__)

# Scoring weights
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


@dataclass
class SupplyMatchResult:
    status: str  # FEASIBLE / PARTIAL / INFEASIBLE
    matched_farmers: List[MatchedFarmer] = field(default_factory=list)
    total_matched_kg: float = 0.0
    shortage_kg: float = 0.0
    infeasibility_reason: Optional[str] = None


async def match_supply(
    crop_name: str,
    required_kg: float,
    delivery_lat: float,
    delivery_lng: float,
    min_quality_grade: str,
    max_price_per_kg: Optional[float],
    db: AsyncSession,
) -> SupplyMatchResult:
    """
    Find the best farmer combination for a buyer's order.

    Problems addressed:
    - #1: Multi-farmer aggregation
    - #2: Radius expansion when local supply insufficient
    - #3: Skip extremely far farmers if not economic
    - #15: Quality filtering
    - #16: Price-aware scoring
    """
    min_quality_value = QUALITY_GRADE_MAP.get(min_quality_grade, 0.0)

    # Query all active listings for this crop
    stmt = select(ProduceListing, User).join(
        User, ProduceListing.seller_id == User.id
    ).where(
        and_(
            ProduceListing.crop_name == crop_name,
            ProduceListing.is_active == True,
            ProduceListing.quantity_kg > 0,
        )
    )
    result = await db.execute(stmt)
    listings_with_users = result.all()

    if not listings_with_users:
        return SupplyMatchResult(
            status="INFEASIBLE",
            shortage_kg=required_kg,
            infeasibility_reason=f"No active listings found for crop '{crop_name}'",
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

    # Compute average price for price scoring (coerce Decimals to float)
    prices = [float(l.price_per_kg) for l, _ in listings_with_users if l.price_per_kg]
    avg_price = sum(prices) / len(prices) if prices else 1.0

    # Score and sort all candidates
    scored_candidates = []
    for listing, user in listings_with_users:
        # Quality filter
        quality_val = QUALITY_GRADE_MAP.get(listing.quality_grade or "C", 0.4)
        if quality_val < min_quality_value:
            continue

        # Price filter
        if max_price_per_kg and listing.price_per_kg and listing.price_per_kg > max_price_per_kg:
            continue

        # Compute distance
        farmer_lat = listing.pickup_latitude or user.latitude or 0
        farmer_lng = listing.pickup_longitude or user.longitude or 0
        if farmer_lat == 0 and farmer_lng == 0:
            continue  # No location data

        dist = haversine(farmer_lat, farmer_lng, delivery_lat, delivery_lng)

        # Score components
        distance_score = 1.0 / (1.0 + dist / 100.0)
        quantity_fit = min(listing.quantity_kg, required_kg) / required_kg
        quality_score = quality_val
        freshness_score = 1.0  # Default; could use harvest_date
        if listing.harvest_date:
            days_since = (datetime.now(timezone.utc) - listing.harvest_date.replace(tzinfo=timezone.utc)).days
            freshness_score = max(0.0, 1.0 - days_since / 14.0)  # 2-week freshness window
        price_score = 1.0 / (1.0 + (float(listing.price_per_kg) if listing.price_per_kg else avg_price) / avg_price) if avg_price > 0 else 0.5
        reliability = reliability_map.get(user.id, 0.7)

        composite = (
            WEIGHT_DISTANCE * distance_score
            + WEIGHT_QUANTITY * quantity_fit
            + WEIGHT_QUALITY * quality_score
            + WEIGHT_FRESHNESS * freshness_score
            + WEIGHT_PRICE * price_score
            + WEIGHT_RELIABILITY * reliability
        )

        scored_candidates.append(MatchedFarmer(
            listing_id=listing.id,
            farmer_id=user.id,
            farmer_name=user.full_name,
            crop_name=listing.crop_name,
            available_kg=listing.quantity_kg,
            allocated_kg=0.0,
            price_per_kg=float(listing.price_per_kg) if listing.price_per_kg else 0.0,
            quality_grade=listing.quality_grade or "C",
            distance_km=round(dist, 2),
            latitude=farmer_lat,
            longitude=farmer_lng,
            score=round(composite, 4),
            reliability_score=reliability,
        ))

    if not scored_candidates:
        return SupplyMatchResult(
            status="INFEASIBLE",
            shortage_kg=required_kg,
            infeasibility_reason=f"No listings match quality/price criteria for '{crop_name}'",
        )

    # Greedy selection with progressive radius expansion
    current_radius = INITIAL_RADIUS_KM
    matched = []
    remaining = required_kg

    while remaining > 0 and current_radius <= MAX_RADIUS_KM:
        # Filter by current radius and sort by score
        candidates_in_radius = [
            c for c in scored_candidates
            if c.distance_km <= current_radius and c.allocated_kg == 0
        ]
        candidates_in_radius.sort(key=lambda c: c.score, reverse=True)

        for candidate in candidates_in_radius:
            if remaining <= 0:
                break

            # Economic check for distant farmers (Problem #3)
            if candidate.distance_km > INITIAL_RADIUS_KM:
                # Rough transport cost estimate
                est_transport = candidate.distance_km * 12.0  # ~12 INR/km average
                est_produce_value = candidate.price_per_kg * min(candidate.available_kg, remaining)
                if est_produce_value > 0 and est_transport > est_produce_value * MAX_TRANSPORT_RATIO:
                    logger.info(
                        f"Skipping distant farmer {candidate.farmer_id} "
                        f"(transport {est_transport:.0f} > {MAX_TRANSPORT_RATIO*100}% "
                        f"of produce {est_produce_value:.0f})"
                    )
                    continue

            alloc = min(candidate.available_kg, remaining)
            candidate.allocated_kg = alloc
            remaining -= alloc
            matched.append(candidate)

        if remaining > 0:
            current_radius += RADIUS_STEP_KM
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
        shortage_kg=round(max(0, remaining), 2),
        infeasibility_reason=(
            f"Only {total_matched:.0f} kg available within {MAX_RADIUS_KM} km radius "
            f"(needed {required_kg:.0f} kg)"
        ) if status != "FEASIBLE" else None,
    )
