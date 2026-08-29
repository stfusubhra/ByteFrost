"""
ByteFrost — ML Serving Module

Loads trained models and exposes prediction functions that the FastAPI
`matching.py` endpoints call. This replaces the placeholder stubs.

Models:
    - price_prediction_xgb.joblib  (XGBoost price recommendation)
    - price_prediction_meta.json   (feature + label mappings)
    - demand_forecast_xgb.joblib   (XGBoost demand forecasting)
    - demand_forecast_meta.json    (feature + label mappings)

Usage (from backend):
    from app.ml.serve import recommend_price, forecast_demand
    result = recommend_price(listing_features)
    forecast = forecast_demand(crop_name, region, recent_demand)
"""

import json
import os
from datetime import date, timedelta

import joblib
import numpy as np
import pandas as pd

# Paths relative to this module (backend/app/ml/serve.py -> backend/ml/models)
# The ml/ directory lives inside backend/ so it is included in the Docker build
# context (dockerContext: ./backend) and the models ship in the image.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "..", "ml", "models")

_price_model = None
_price_meta = None
_demand_model = None
_demand_meta = None

# Approximate festival dates (2024-2026) for demand feature engineering
FESTIVAL_DATES = {
    "2024-10-31", "2025-03-14", "2025-10-20", "2026-03-03", "2026-11-08",
    "2024-08-15", "2025-08-15", "2026-08-15",
    "2024-12-25", "2025-12-25", "2026-12-25",
}


def _load_price_model():
    """Lazily load the price prediction model and metadata."""
    global _price_model, _price_meta
    if _price_model is None:
        model_path = os.path.join(MODEL_DIR, "price_prediction_xgb.joblib")
        meta_path = os.path.join(MODEL_DIR, "price_prediction_meta.json")
        _price_model = joblib.load(model_path)
        with open(meta_path) as f:
            _price_meta = json.load(f)
    return _price_model, _price_meta


def _encode_label(value: str, mapping: dict) -> int:
    """Map a label back to its encoded integer, defaulting to 0."""
    for code, name in mapping.items():
        if name == value:
            return int(code)
    return 0


def recommend_price(
    crop_name: str,
    mandi: str,
    month: int,
    week_of_year: int,
    day_of_year: int,
    lag_7: float,
    lag_14: float,
    lag_30: float,
    rolling_mean_7: float,
    rolling_std_7: float,
    quantity_log: float,
    quantity_lag_7: float,
) -> dict:
    """
    Predict a recommended price band for a produce listing.

    Returns a dict matching the API contract:
        {
            "recommended_price": float,
            "confidence": float,
            "price_band": {"low": float, "mid": float, "high": float},
            "factors": [str, ...]
        }
    """
    model, meta = _load_price_model()

    crop_encoded = _encode_label(crop_name, meta["crop_map"])
    mandi_encoded = _encode_label(mandi, meta["mandi_map"])

    features = pd.DataFrame([{
        "crop_encoded": crop_encoded,
        "mandi_encoded": mandi_encoded,
        "month": month,
        "week_of_year": week_of_year,
        "day_of_year": day_of_year,
        "lag_7": lag_7,
        "lag_14": lag_14,
        "lag_30": lag_30,
        "rolling_mean_7": rolling_mean_7,
        "rolling_std_7": rolling_std_7,
        "quantity_log": quantity_log,
        "quantity_lag_7": quantity_lag_7,
    }])

    pred = float(model.predict(features)[0])

    # Price band: use model's residual spread as a proxy for interval width
    # (approx 1 sigma from training MAE)
    sigma = meta["metrics"]["mae"] * 1.25
    low = max(pred - sigma, 0.0)
    high = pred + sigma

    # Confidence: higher when recent price volatility is low
    vol = rolling_std_7 / (rolling_mean_7 + 1e-9)
    confidence = float(np.clip(1.0 - vol * 2.0, 0.5, 0.95))

    return {
        "recommended_price": round(pred, 2),
        "confidence": round(confidence, 3),
        "price_band": {
            "low": round(low, 2),
            "mid": round(pred, 2),
            "high": round(high, 2),
        },
        "factors": [
            "historical_mandi_prices",
            "seasonality",
            "demand_signal",
            "regional_price_level",
        ],
    }


def _load_demand_model():
    """Lazily load the demand forecasting model and metadata."""
    global _demand_model, _demand_meta
    if _demand_model is None:
        model_path = os.path.join(MODEL_DIR, "demand_forecast_xgb.joblib")
        meta_path = os.path.join(MODEL_DIR, "demand_forecast_meta.json")
        _demand_model = joblib.load(model_path)
        with open(meta_path) as f:
            _demand_meta = json.load(f)
    return _demand_model, _demand_meta


def _demand_features(
    crop_encoded: int,
    region_encoded: int,
    d: date,
    lag_1: float,
    lag_7: float,
    lag_30: float,
    rolling_mean_7: float,
    rolling_std_7: float,
    rolling_mean_30: float,
) -> dict:
    """Build a single feature row for the demand model."""
    dow = d.weekday()
    return {
        "crop_encoded": crop_encoded,
        "region_encoded": region_encoded,
        "month": d.month,
        "week_of_year": d.isocalendar().week,
        "day_of_week": dow,
        "is_weekend": int(dow >= 5),
        "is_festival": int(d.isoformat() in FESTIVAL_DATES),
        "lag_1": lag_1,
        "lag_7": lag_7,
        "lag_30": lag_30,
        "rolling_mean_7": rolling_mean_7,
        "rolling_std_7": rolling_std_7,
        "rolling_mean_30": rolling_mean_30,
    }


def forecast_demand(
    crop_name: str,
    region: str,
    recent_demand: list,
    horizons: tuple = (7, 30),
) -> dict:
    """
    Forecast demand (kg) for a crop-region over 7-day and 30-day horizons.

    Uses recursive multi-step forecasting: each predicted day feeds the
    lag features of the next day.

    Args:
        crop_name: crop label (e.g. "tomato")
        region: region label (e.g. "North India")
        recent_demand: list of recent daily demand_kg values (>= 30 entries,
            oldest first) used to seed lag features.
        horizons: tuple of forecast horizons in days.

    Returns a dict matching the API contract:
        {
            "crop": str,
            "region": str,
            "forecast": [
                {"week": int, "predicted_demand_kg": float, "confidence": float},
                ...
            ],
            "horizon_days": int
        }
    """
    model, meta = _load_demand_model()

    crop_encoded = _encode_label(crop_name, meta["crop_map"])
    region_encoded = _encode_label(region, meta["region_map"])

    # Seed history from recent demand (log-transformed)
    hist = [np.log1p(max(float(x), 0.0)) for x in recent_demand]
    if len(hist) < 30:
        # Pad with the mean if insufficient history
        pad = [np.log1p(float(np.mean(recent_demand)))] * (30 - len(hist))
        hist = pad + hist

    # Start forecasting from tomorrow
    start_date = date.today() + timedelta(days=1)
    max_horizon = max(horizons)

    predictions = []
    for i in range(max_horizon):
        d = start_date + timedelta(days=i)
        lag_1 = hist[-1]
        lag_7 = hist[-7] if len(hist) >= 7 else hist[0]
        lag_30 = hist[-30] if len(hist) >= 30 else hist[0]
        rolling_mean_7 = float(np.mean(hist[-7:]))
        rolling_std_7 = float(np.std(hist[-7:])) if len(hist) >= 7 else 0.0
        rolling_mean_30 = float(np.mean(hist[-30:]))

        feat = _demand_features(
            crop_encoded, region_encoded, d,
            lag_1, lag_7, lag_30,
            rolling_mean_7, rolling_std_7, rolling_mean_30,
        )
        pred_log = float(model.predict(pd.DataFrame([feat]))[0])
        pred_kg = float(np.expm1(pred_log))
        predictions.append((d, pred_kg))

        # Feed prediction back into history for recursive forecasting
        hist.append(pred_log)

    # Aggregate into weekly buckets for the requested horizons
    forecast = []
    for horizon in horizons:
        weekly = []
        for i in range(0, horizon, 7):
            week_slice = predictions[i:i + 7]
            week_demand = sum(p for _, p in week_slice)
            weekly.append(week_demand)
        # Confidence: decreases with horizon (uncertainty grows)
        base_conf = 0.85
        conf = max(base_conf - 0.02 * (horizon / 7), 0.5)
        forecast.append({
            "week": horizon // 7,
            "predicted_demand_kg": round(sum(p for _, p in predictions[:horizon]), 1),
            "confidence": round(conf, 3),
        })

    return {
        "crop": crop_name,
        "region": region,
        "forecast": forecast,
        "horizon_days": list(horizons),
    }


# ---------------------------------------------------------------------------
# Buyer-Seller Matching (weighted scoring)
# ---------------------------------------------------------------------------

# Default weights for the matching dimensions (sum to 1.0)
DEFAULT_MATCH_WEIGHTS = {
    "quantity_fit": 0.25,
    "price_compatibility": 0.25,
    "distance": 0.20,
    "reliability": 0.15,
    "transaction_history": 0.15,
}


def _haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance between two lat/lon points in km."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    R = 6371.0
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dp = np.radians(lat2 - lat1)
    dl = np.radians(lon2 - lon1)
    a = np.sin(dp / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dl / 2) ** 2
    return float(R * 2 * np.arcsin(np.sqrt(a)))


def _quantity_fit_score(listing_qty, buyer_avg_qty):
    """How well the buyer's typical order size matches the listing quantity."""
    if not buyer_avg_qty or buyer_avg_qty <= 0:
        # No order history: neutral (0.5) — can't judge fit
        return 0.5
    ratio = listing_qty / buyer_avg_qty
    # Perfect when ratio ~ 1; penalize both over- and under-sizing.
    # Use log-ratio so 2x and 0.5x are symmetric.
    log_ratio = abs(np.log(max(ratio, 1e-6)))
    return float(np.clip(1.0 - log_ratio / np.log(4.0), 0.0, 1.0))


def _price_compatibility_score(listing_price, buyer_avg_price):
    """How close the buyer's typical price is to the listing price."""
    if not buyer_avg_price or buyer_avg_price <= 0:
        return 0.5  # no history, neutral
    if not listing_price or listing_price <= 0:
        return 0.5  # no listing price, neutral
    ratio = buyer_avg_price / listing_price
    log_ratio = abs(np.log(max(ratio, 1e-6)))
    # Within ~25% (log 1.25) is a good match
    return float(np.clip(1.0 - log_ratio / np.log(1.25), 0.0, 1.0))


def _distance_score(km):
    """Score decays with distance; ~50km is a strong match, 500km+ weak."""
    if km is None:
        return 0.5  # unknown location, neutral
    return float(np.clip(1.0 - km / 500.0, 0.0, 1.0))


def _reliability_score(is_verified, completed_orders, total_orders):
    """Reliability from verification status and completed-order ratio."""
    completion_ratio = 0.0
    if total_orders and total_orders > 0:
        completion_ratio = completed_orders / total_orders
    verified_bonus = 0.2 if is_verified else 0.0
    return float(np.clip(completion_ratio * 0.8 + verified_bonus, 0.0, 1.0))


def _transaction_history_score(completed_orders, total_volume_kg):
    """Reward buyers with more completed orders and larger purchase volume."""
    # Saturating function: more history -> higher score, capped at 1.0
    order_score = 1.0 - np.exp(-completed_orders / 10.0)
    volume_score = 1.0 - np.exp(-(total_volume_kg or 0.0) / 5000.0)
    return float(np.clip(0.5 * order_score + 0.5 * volume_score, 0.0, 1.0))


def score_buyer_matches(listing, buyers, weights=None):
    """
    Rank candidate buyers for a produce listing using weighted scoring.

    Args:
        listing: dict with keys:
            - quantity_kg (float)
            - price_per_kg (float, optional)
            - pickup_latitude / pickup_longitude (float, optional)
        buyers: list of dicts, each with keys:
            - buyer_id (str/UUID)
            - latitude / longitude (float, optional)
            - is_verified (bool)
            - avg_order_quantity_kg (float, optional)
            - avg_price_per_kg (float, optional)
            - completed_orders (int)
            - total_orders (int)
            - total_volume_kg (float)
        weights: optional dict overriding DEFAULT_MATCH_WEIGHTS.

    Returns:
        List of dicts sorted by score desc:
            {
                "buyer_id": str,
                "score": float (0-1),
                "explanation": {
                    "quantity_fit": float,
                    "price_compatibility": float,
                    "distance": float,
                    "reliability": float,
                    "transaction_history": float,
                },
            }
    """
    w = dict(DEFAULT_MATCH_WEIGHTS)
    if weights:
        w.update(weights)

    listing_qty = float(listing.get("quantity_kg") or 0.0)
    listing_price = listing.get("price_per_kg")
    listing_lat = listing.get("pickup_latitude")
    listing_lon = listing.get("pickup_longitude")

    results = []
    for b in buyers:
        qty = _quantity_fit_score(listing_qty, b.get("avg_order_quantity_kg"))
        price = _price_compatibility_score(listing_price, b.get("avg_price_per_kg"))
        km = _haversine_km(
            listing_lat, listing_lon, b.get("latitude"), b.get("longitude")
        )
        dist = _distance_score(km)
        rel = _reliability_score(
            b.get("is_verified", False),
            b.get("completed_orders", 0),
            b.get("total_orders", 0),
        )
        hist = _transaction_history_score(
            b.get("completed_orders", 0), b.get("total_volume_kg", 0.0)
        )

        score = (
            w["quantity_fit"] * qty
            + w["price_compatibility"] * price
            + w["distance"] * dist
            + w["reliability"] * rel
            + w["transaction_history"] * hist
        )

        results.append({
            "buyer_id": str(b["buyer_id"]),
            "score": round(float(score), 4),
            "explanation": {
                "quantity_fit": round(qty, 4),
                "price_compatibility": round(price, 4),
                "distance": round(dist, 4),
                "reliability": round(rel, 4),
                "transaction_history": round(hist, 4),
            },
        })

    results.sort(key=lambda r: r["score"], reverse=True)
    return results


if __name__ == "__main__":
    # Quick smoke test
    result = recommend_price(
        crop_name="tomato",
        mandi="Azadpur, Delhi",
        month=8,
        week_of_year=35,
        day_of_year=240,
        lag_7=1900.0,
        lag_14=1850.0,
        lag_30=1800.0,
        rolling_mean_7=1880.0,
        rolling_std_7=120.0,
        quantity_log=np.log1p(2500),
        quantity_lag_7=np.log1p(2400),
    )
    print("=== Price Recommendation ===")
    print(json.dumps(result, indent=2))

    # Demand forecast smoke test
    recent = [150000 + 5000 * np.sin(i / 7) + np.random.normal(0, 8000)
              for i in range(60)]
    fc = forecast_demand("tomato", "North India", recent)
    print("\n=== Demand Forecast ===")
    print(json.dumps(fc, indent=2))

    # Buyer-seller matching smoke test
    listing = {
        "quantity_kg": 2000.0,
        "price_per_kg": 25.0,
        "pickup_latitude": 28.6,
        "pickup_longitude": 77.2,  # Delhi
    }
    buyers = [
        {"buyer_id": "b1", "latitude": 28.6, "longitude": 77.2,
         "is_verified": True, "avg_order_quantity_kg": 1800.0,
         "avg_price_per_kg": 24.0, "completed_orders": 25,
         "total_orders": 30, "total_volume_kg": 45000.0},
        {"buyer_id": "b2", "latitude": 19.0, "longitude": 72.8,
         "is_verified": False, "avg_order_quantity_kg": 500.0,
         "avg_price_per_kg": 18.0, "completed_orders": 2,
         "total_orders": 10, "total_volume_kg": 1000.0},
        {"buyer_id": "b3", "latitude": 28.6, "longitude": 77.2,
         "is_verified": True, "avg_order_quantity_kg": 2000.0,
         "avg_price_per_kg": 25.0, "completed_orders": 60,
         "total_orders": 60, "total_volume_kg": 120000.0},
    ]
    matches = score_buyer_matches(listing, buyers)
    print("\n=== Buyer-Seller Matches ===")
    print(json.dumps(matches, indent=2))
