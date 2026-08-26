from fastapi import APIRouter, Depends
from uuid import UUID

from app.core.security import get_current_user
from app.schemas.schemas import MatchRequest, MatchResult

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
    current_user: dict = Depends(get_current_user),
):
    """
    AI-powered price recommendation.
    TODO: Integrate with ML service.
    """
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
    current_user: dict = Depends(get_current_user),
):
    """
    AI-powered demand forecasting.
    TODO: Integrate with ML service.
    """
    return {
        "crop": crop_name,
        "region": region,
        "forecast": [
            {"week": 1, "predicted_demand_kg": 5000, "confidence": 0.8},
            {"week": 2, "predicted_demand_kg": 6200, "confidence": 0.75},
            {"week": 3, "predicted_demand_kg": 5800, "confidence": 0.7},
        ],
    }
