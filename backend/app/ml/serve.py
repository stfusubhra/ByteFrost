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

# Paths relative to this module (backend/app/ml/serve.py -> repo root ml/models)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "..", "..", "ml", "models")

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
