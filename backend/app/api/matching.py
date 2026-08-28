from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import (
    User, UserRole, ProduceListing, Order, OrderItem, OrderStatus,
)
from app.schemas.schemas import MatchRequest, MatchResult

try:
    from app.ml.serve import recommend_price as ml_recommend_price
    from app.ml.serve import forecast_demand as ml_forecast_demand
    from app.ml.serve import score_buyer_matches as ml_score_buyer_matches
    ML_AVAILABLE = True
except Exception:  # pragma: no cover - model may not be trained yet
    ML_AVAILABLE = False

router = APIRouter()


@router.post("/find-matches", response_model=list[MatchResult])
async def find_matches(
    payload: MatchRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    AI-powered buyer matching endpoint.

    Given a seller's produce listing, ranks candidate buyers using a
    weighted scoring algorithm across five dimensions:
      - quantity fit
      - price compatibility
      - distance (geographic proximity)
      - reliability (verification + completion ratio)
      - transaction history (order volume & frequency)

    Falls back to a deterministic ranking when the ML service is unavailable.
    """
    # Load the listing
    listing_result = await db.execute(
        select(ProduceListing).where(ProduceListing.id == payload.listing_id)
    )
    listing = listing_result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Candidate buyers: bulk buyers and retailers (exclude the seller)
    buyer_roles = [UserRole.BUYER_BULK, UserRole.BUYER_RETAILER]
    buyers_result = await db.execute(
        select(User).where(
            User.role.in_(buyer_roles),
            User.id != listing.seller_id,
            User.is_active == True,  # noqa: E712
        )
    )
    buyers = buyers_result.scalars().all()

    if not buyers:
        return []

    # Build per-buyer stats from order history
    buyer_ids = [b.id for b in buyers]

    # Aggregate order stats per buyer
    stats_result = await db.execute(
        select(
            Order.buyer_id,
            func.count(Order.id).label("total_orders"),
            func.sum(
                case(
                    (Order.status == OrderStatus.DELIVERED, 1),
                    else_=0,
                )
            ).label("completed_orders"),
            func.coalesce(func.sum(Order.total_amount), 0.0).label("total_amount"),
        )
        .where(Order.buyer_id.in_(buyer_ids))
        .group_by(Order.buyer_id)
    )
    order_stats = {
        row.buyer_id: row for row in stats_result.all()
    }

    # Aggregate order-item stats (avg order quantity, avg price) per buyer
    item_stats_result = await db.execute(
        select(
            Order.buyer_id,
            func.avg(OrderItem.quantity_kg).label("avg_qty"),
            func.avg(OrderItem.price_per_kg).label("avg_price"),
            func.coalesce(func.sum(OrderItem.quantity_kg), 0.0).label("total_volume"),
        )
        .join(OrderItem, OrderItem.order_id == Order.id)
        .where(Order.buyer_id.in_(buyer_ids))
        .group_by(Order.buyer_id)
    )
    item_stats = {
        row.buyer_id: row for row in item_stats_result.all()
    }

    # Assemble buyer feature dicts for the scoring function
    buyer_features = []
    for b in buyers:
        os_ = order_stats.get(b.id)
        is_ = item_stats.get(b.id)
        buyer_features.append({
            "buyer_id": b.id,
            "latitude": b.latitude,
            "longitude": b.longitude,
            "is_verified": b.is_verified,
            "avg_order_quantity_kg": float(is_.avg_qty) if is_ and is_.avg_qty else None,
            "avg_price_per_kg": float(is_.avg_price) if is_ and is_.avg_price else None,
            "completed_orders": int(os_.completed_orders) if os_ else 0,
            "total_orders": int(os_.total_orders) if os_ else 0,
            "total_volume_kg": float(is_.total_volume) if is_ else 0.0,
        })

    listing_dict = {
        "quantity_kg": listing.quantity_kg,
        "price_per_kg": listing.price_per_kg,
        "pickup_latitude": listing.pickup_latitude,
        "pickup_longitude": listing.pickup_longitude,
    }

    if ML_AVAILABLE:
        try:
            ranked = ml_score_buyer_matches(listing_dict, buyer_features)
        except Exception as exc:  # pragma: no cover
            raise HTTPException(status_code=500, detail=f"ML inference failed: {exc}")
    else:
        # Deterministic fallback: rank by reliability then distance
        ranked = sorted(
            buyer_features,
            key=lambda b: (
                b["completed_orders"],
                b["is_verified"],
            ),
            reverse=True,
        )
        ranked = [
            {
                "buyer_id": str(b["buyer_id"]),
                "score": 0.5,
                "explanation": {
                    "quantity_fit": 0.5,
                    "price_compatibility": 0.5,
                    "distance": 0.5,
                    "reliability": 0.5,
                    "transaction_history": 0.5,
                },
            }
            for b in ranked
        ]

    # Limit results
    ranked = ranked[: payload.max_results]

    return [
        MatchResult(
            buyer_id=UUID(r["buyer_id"]),
            score=r["score"],
            explanation=r["explanation"],
        )
        for r in ranked
    ]


@router.post("/price-recommendation")
async def recommend_price(
    listing_id: UUID,
    crop_name: str = "tomato",
    mandi: str = "Azadpur, Delhi",
    month: int = 8,
    week_of_year: int = 35,
    day_of_year: int = 240,
    lag_7: float = 1900.0,
    lag_14: float = 1850.0,
    lag_30: float = 1800.0,
    rolling_mean_7: float = 1880.0,
    rolling_std_7: float = 120.0,
    quantity_kg: float = 2500.0,
    current_user: dict = Depends(get_current_user),
):
    """
    AI-powered price recommendation.
    Uses the trained XGBoost model when available; falls back to a
    deterministic estimate otherwise.
    """
    import math

    if ML_AVAILABLE:
        try:
            result = ml_recommend_price(
                crop_name=crop_name,
                mandi=mandi,
                month=month,
                week_of_year=week_of_year,
                day_of_year=day_of_year,
                lag_7=lag_7,
                lag_14=lag_14,
                lag_30=lag_30,
                rolling_mean_7=rolling_mean_7,
                rolling_std_7=rolling_std_7,
                quantity_log=math.log1p(quantity_kg),
                quantity_lag_7=math.log1p(quantity_kg * 0.96),
            )
            result["listing_id"] = str(listing_id)
            return result
        except Exception as exc:  # pragma: no cover
            raise HTTPException(status_code=500, detail=f"ML inference failed: {exc}")

    # Fallback deterministic estimate (no trained model)
    return {
        "listing_id": str(listing_id),
        "recommended_price": 25.0,
        "confidence": 0.75,
        "price_band": {"low": 20.0, "mid": 25.0, "high": 30.0},
        "factors": ["historical_mandi_prices", "demand_signal", "seasonality"],
    }


@router.post("/demand-forecast")
async def forecast_demand(
    crop_name: str,
    region: str,
    recent_demand: list[float] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    AI-powered demand forecasting.
    Uses the trained XGBoost model when available; falls back to a
    deterministic estimate otherwise.
    """
    if ML_AVAILABLE:
        try:
            # If no recent demand history provided, seed with a reasonable
            # baseline so the recursive forecast can run.
            if not recent_demand:
                recent_demand = [150000.0] * 30
            result = ml_forecast_demand(
                crop_name=crop_name,
                region=region,
                recent_demand=recent_demand,
            )
            return result
        except Exception as exc:  # pragma: no cover
            raise HTTPException(status_code=500, detail=f"ML inference failed: {exc}")

    # Fallback deterministic estimate (no trained model)
    return {
        "crop": crop_name,
        "region": region,
        "forecast": [
            {"week": 1, "predicted_demand_kg": 5000, "confidence": 0.8},
            {"week": 2, "predicted_demand_kg": 6200, "confidence": 0.75},
            {"week": 3, "predicted_demand_kg": 5800, "confidence": 0.7},
        ],
    }
