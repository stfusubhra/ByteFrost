"""
ByteFrost — ML Serving Module

Loads trained models and exposes prediction functions that the FastAPI
`matching.py` endpoints call. This replaces the placeholder stubs.

Models:
    - price_prediction_xgb.joblib  (XGBoost price recommendation)
    - price_prediction_meta.json   (feature + label mappings)

Usage (from backend):
    from app.ml.serve import recommend_price
    result = recommend_price(listing_features)
"""

import json
import os

import joblib
import numpy as np
import pandas as pd

# Paths relative to this module (backend/app/ml/serve.py -> repo root ml/models)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "..", "..", "ml", "models")

_price_model = None
_price_meta = None


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
    print(json.dumps(result, indent=2))
