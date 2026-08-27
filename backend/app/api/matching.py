from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from app.core.security import get_current_user
from app.schemas.schemas import MatchRequest, MatchResult

try:
    from app.ml.serve import recommend_price as ml_recommend_price
    from app.ml.serve import forecast_demand as ml_forecast_demand
    ML_AVAILABLE = True
except Exception:  # pragma: no cover - model may not be trained yet
    ML_AVAILABLE = False

router = APIRouter()


@router.post("/find-matches", response_model=list[MatchResult])
async def find_matches(
    payload: MatchRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    AI-powered buyer matching endpoint.
    TODO: Integrate with ML service for scoring.
    """
    # Placeholder: return dummy match
    return [
        MatchResult(
            buyer_id=UUID("00000000-0000-0000-0000-000000000000"),
            score=0.85,
            explanation={
                "quantity_fit": 0.9,
                "price_score": 0.8,
                "distance_score": 0.7,
                "reliability": 0.9,
            },
        )
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
