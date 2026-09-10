"""
ByteFrost — Marketplace Intelligence Endpoint

Provides unified market intelligence for listings and buyer requirements.
This endpoint combines demand signals, price recommendations, and buyer
matching into a single call for real-time workflow integration.

API Flow:
  POST /api/v1/intelligence/listing/{listing_id}
    → Returns: demand_signal, price_recommendation, buyer_opportunities

  POST /api/v1/intelligence/supply-discovery
    → Input: crop, quantity, location, deadline
    → Returns: available_supply, fulfillment_plan

Usage:
    Call from frontend during listing creation or buyer requirement entry
    to show real-time market intelligence without separate API calls.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import Optional, List
import math
from datetime import date, datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import ProduceListing, User, UserRole, OrderItem
from app.schemas.schemas import (
    MatchRequest,
    MatchResult,
    BuyerRequirement,
    SupplierMatchResponse,
    MatchedFarmerResponse,
)
from app.services.maps_service import haversine
from app.services.supply_matching_service import match_supply

# Optional ML serving module
try:
    from app.ml.serve import recommend_price as ml_recommend_price
    from app.ml.serve import forecast_demand as ml_forecast_demand
    from app.ml.serve import score_buyer_matches as ml_score_buyer_matches
    ML_AVAILABLE = True
except Exception:
    ML_AVAILABLE = False

router = APIRouter(tags=["marketplace-intelligence"])

BUYER_ROLES = {
    UserRole.BUYER_BULK,
    UserRole.BUYER_RETAILER,
    UserRole.CONSUMER,
    UserRole.FPO_MANAGER,
}


@router.get("/listing/{listing_id}")
async def get_listing_intelligence(
    listing_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get comprehensive market intelligence for a listing.
    
    Returns:
    - demand_signal: Current demand trend for the crop
    - price_recommendation: ML-based price suggestion
    - buyer_opportunities: Ranked potential buyers
    """
    # Load listing
    result = await db.execute(
        select(ProduceListing).where(ProduceListing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    intelligence = {
        "listing_id": str(listing_id),
        "crop": listing.crop_name,
        "quantity_kg": listing.quantity_kg,
        "price_per_kg": listing.price_per_kg,
        "location": listing.pickup_location,
    }
    
    # 1. Demand Signal (from order history)
    demand_result = await db.execute(
        select(func.sum(OrderItem.quantity_kg)).where(
            OrderItem.listing_id == listing_id
        )
    )
    total_ordered = demand_result.scalar() or 0
    
    # Get recent orders for trend
    from app.models.models import Order
    recent_result = await db.execute(
        select(func.count(Order.id)).where(
            Order.status.in_(["PENDING", "CONFIRMED", "ALLOCATED"]),
            Order.created_at >= datetime.now() - timedelta(days=7)
        )
    )
    recent_orders = recent_result.scalar() or 0
    
    intelligence["demand_signal"] = {
        "total_ordered_kg": round(total_ordered, 1),
        "recent_order_count": recent_orders,
        "signal": "strong" if recent_orders > 2 else "moderate" if recent_orders > 0 else "low",
    }
    
    # 2. Price Recommendation
    if ML_AVAILABLE:
        try:
            price = float(listing.price_per_kg) if listing.price_per_kg else 25.0
            qty = float(listing.quantity_kg) if listing.quantity_kg else 1000.0
            today = date.today()
            price_q = price * 100.0
            
            price_result = ml_recommend_price(
                crop_name=listing.crop_name,
                mandi=listing.pickup_location or "Azadpur, Delhi",
                month=today.month,
                week_of_year=today.isocalendar().week,
                day_of_year=today.timetuple().tm_yday,
                lag_7=price_q,
                lag_14=price_q * 0.98,
                lag_30=price_q * 0.95,
                rolling_mean_7=price_q,
                rolling_std_7=price_q * 0.06,
                quantity_log=math.log1p(qty),
                quantity_lag_7=math.log1p(qty * 0.96),
            )
            intelligence["price_recommendation"] = price_result
        except Exception as e:
            intelligence["price_recommendation"] = {"error": str(e)}
    else:
        # Fallback: comparable listings
        comparable = await db.execute(
            select(ProduceListing.price_per_kg).where(
                ProduceListing.crop_name == listing.crop_name,
                ProduceListing.is_active == True,
                ProduceListing.price_per_kg.isnot(None),
                ProduceListing.id != listing_id,
            )
        )
        prices = [float(p) for p in comparable.scalars().all()]
        if prices:
            prices.sort()
            intelligence["price_recommendation"] = {
                "recommended_price": round(prices[len(prices)//2], 2),
                "confidence": 0.7,
                "price_band": {
                    "low": round(prices[0], 2),
                    "mid": round(prices[len(prices)//2], 2),
                    "high": round(prices[-1], 2),
                },
                "factors": ["comparable_listings"],
            }
    
    # 3. Buyer Opportunities
    result = await db.execute(
        select(User).where(
            User.role.in_(list(BUYER_ROLES)),
            User.is_active == True,
            User.id != listing.seller_id,
        )
    )
    buyers = result.scalars().all()
    
    if buyers and ML_AVAILABLE:
        try:
            listing_dict = {
                "quantity_kg": listing.quantity_kg,
                "price_per_kg": listing.price_per_kg,
                "pickup_latitude": listing.pickup_latitude,
                "pickup_longitude": listing.pickup_longitude,
            }
            buyer_features = []
            for buyer in buyers[:10]:  # Top 10 buyers
                buyer_features.append({
                    "buyer_id": str(buyer.id),
                    "latitude": buyer.latitude,
                    "longitude": buyer.longitude,
                    "is_verified": buyer.is_verified,
                    "avg_order_quantity_kg": None,
                    "avg_price_per_kg": None,
                    "completed_orders": 0,
                    "total_orders": 0,
                    "total_volume_kg": 0.0,
                })
            
            if buyer_features:
                ranked = ml_score_buyer_matches(listing_dict, buyer_features)
                intelligence["buyer_opportunities"] = ranked[:5]
        except Exception as e:
            intelligence["buyer_opportunities"] = []
    
    return intelligence


@router.post("/supply-discovery")
async def discover_supply(
    crop_name: str,
    required_kg: float,
    delivery_lat: float,
    delivery_lng: float,
    max_price_per_kg: Optional[float] = None,
    min_quality_grade: str = "B",
    db: AsyncSession = Depends(get_db),
):
    """
    Discover available supply for a buyer requirement.
    
    Returns:
    - available_supply: List of matching listings with quantities
    - fulfillment_potential: Percentage that can be fulfilled
    - recommendation: Suggested action
    """
    # Find matching active listings
    result = await db.execute(
        select(ProduceListing).where(
            func.lower(func.trim(ProduceListing.crop_name)) == func.lower(crop_name.strip()),
            ProduceListing.is_active == True,
            ProduceListing.quantity_kg > 0,
        )
    )
    listings = result.scalars().all()
    
    if not listings:
        return {
            "crop": crop_name,
            "required_kg": required_kg,
            "available_supply": [],
            "total_available_kg": 0,
            "fulfillment_potential": 0.0,
            "recommendation": "no_supply_found",
        }
    
    # Score and filter listings
    scored_listings = []
    for listing in listings:
        # Calculate distance
        if listing.pickup_latitude and listing.pickup_longitude:
            distance_km = haversine(
                listing.pickup_latitude, listing.pickup_longitude,
                delivery_lat, delivery_lng
            )
        else:
            distance_km = None
        
        # Price filter
        if max_price_per_kg and listing.price_per_kg:
            if listing.price_per_kg > max_price_per_kg:
                continue
        
        # Quality filter
        from app.services.supply_matching_service import QUALITY_GRADE_MAP
        quality_val = QUALITY_GRADE_MAP.get(listing.quality_grade or "C", 0.4)
        min_quality = QUALITY_GRADE_MAP.get(min_quality_grade, 0.0)
        if quality_val < min_quality:
            continue
        
        scored_listings.append({
            "listing_id": str(listing.id),
            "farm_name": listing.pickup_location,
            "quantity_kg": listing.quantity_kg,
            "price_per_kg": listing.price_per_kg,
            "quality_grade": listing.quality_grade,
            "distance_km": round(distance_km, 1) if distance_km else None,
            "harvest_date": listing.harvest_date.isoformat() if listing.harvest_date else None,
        })
    
    total_available = sum(l["quantity_kg"] for l in scored_listings)
    fulfillment_pct = min(100.0, (total_available / required_kg) * 100) if required_kg > 0 else 0
    
    if fulfillment_pct >= 100:
        recommendation = "fully_fulfillable"
    elif fulfillment_pct >= 50:
        recommendation = "partially_fulfillable"
    else:
        recommendation = "insufficient_supply"
    
    return {
        "crop": crop_name,
        "required_kg": required_kg,
        "available_supply": scored_listings,
        "total_available_kg": round(total_available, 1),
        "shortage_kg": round(max(0, required_kg - total_available), 1),
        "fulfillment_potential": round(fulfillment_pct, 1),
        "recommendation": recommendation,
        "num_sources": len(scored_listings),
    }


@router.post("/fulfillment-plan")
async def create_fulfillment_plan(
    payload: BuyerRequirement,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a fulfillment plan by combining matching and allocation.
    
    This is the core of the integrated workflow:
    1. Find matching suppliers
    2. Allocate quantities
    3. Return executable procurement plan
    """
    result = await match_supply(
        crop_name=payload.crop_name,
        required_kg=payload.required_quantity_kg,
        delivery_lat=payload.delivery_latitude,
        delivery_lng=payload.delivery_longitude,
        min_quality_grade=payload.min_quality_grade,
        max_price_per_kg=payload.max_price_per_kg,
        delivery_deadline=payload.delivery_deadline,
        db=db,
    )
    
    # Format response
    matched_farmers = []
    for f in result.matched_farmers:
        matched_farmers.append({
            "listing_id": str(f.listing_id),
            "farmer_id": str(f.farmer_id),
            "farmer_name": f.farmer_name,
            "crop_name": f.crop_name,
            "available_kg": f.available_kg,
            "allocated_kg": f.allocated_kg,
            "price_per_kg": f.price_per_kg,
            "quality_grade": f.quality_grade,
            "distance_km": f.distance_km,
            "score": f.score,
            "explanation": f.explanation,
        })
    
    return {
        "status": result.status,
        "matched_farmers": matched_farmers,
        "total_matched_kg": result.total_matched_kg,
        "required_kg": result.required_kg,
        "shortage_kg": result.shortage_kg,
        "fulfillment_percentage": round(
            (result.total_matched_kg / result.required_kg * 100) 
            if result.required_kg > 0 else 0, 1
        ),
        "infeasibility_reason": result.infeasibility_reason,
    }
