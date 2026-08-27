# ByteFrost — ML / AI Workstream

> **Owner:** Agni Pratap Pramanik (AI/ML)
> **Sprint 1:** Aug 26–31, 2026

This directory contains the AI/ML work for ByteFrost: planning, data generation, model training, and serving.

## Directory layout

```
ml/
├── PLANNING.md                    # Task 1 planning deliverable (stack, data, architecture, compute)
├── generate_synthetic_data.py     # Synthetic mandi price data generator
├── train_price_prediction.py      # XGBoost price prediction training + evaluation
├── generate_synthetic_demand.py   # Synthetic demand data generator (crop-region-time)
├── train_demand_forecast.py       # XGBoost demand forecasting training + evaluation
├── data/
│   ├── synthetic_mandi_prices.csv # Generated synthetic data (200k rows)
│   └── synthetic_demand.csv       # Generated synthetic demand data (100k rows)
├── models/
│   ├── price_prediction_xgb.joblib  # Trained XGBoost price model
│   ├── price_prediction_meta.json   # Price feature + label mappings, metrics
│   ├── demand_forecast_xgb.joblib   # Trained XGBoost demand model
│   └── demand_forecast_meta.json    # Demand feature + label mappings, metrics
├── notebooks/                     # Jupyter notebooks (prototyping)
└── .venv/                         # Python virtual environment (Python 3.13)
```

The serving module lives in the backend so FastAPI can call it:
```
backend/app/ml/serve.py            # Loads models, exposes recommend_price() + forecast_demand()
```

## Environment setup

```bash
cd ml
python3.13 -m venv .venv
source .venv/bin/activate
pip install pandas numpy scikit-learn xgboost jupyter matplotlib seaborn
```

**macOS note:** XGBoost requires the OpenMP runtime. Install it and set the library path:

```bash
brew install libomp
export DYLD_LIBRARY_PATH="/opt/homebrew/opt/libomp/lib:$DYLD_LIBRARY_PATH"
```

## Generate synthetic data

```bash
cd ml
.venv/bin/python generate_synthetic_data.py --rows 200000
# -> data/synthetic_mandi_prices.csv
```

Format (agreed standard): `[date, crop, mandi, price_per_quintal, quantity]`

## Train the price prediction model

```bash
cd ml
export DYLD_LIBRARY_PATH="/opt/homebrew/opt/libomp/lib:$DYLD_LIBRARY_PATH"
.venv/bin/python train_price_prediction.py
```

Current results (synthetic data, 3-month holdout):
- **RMSE:** 298.31 Rs/quintal
- **MAE:** 203.60 Rs/quintal
- **MAPE:** 5.15%

## Serve / integrate with backend

The `recommend_price` endpoint in `backend/app/api/matching.py` now calls the trained model via `backend/app/ml/serve.py`. It falls back to a deterministic estimate if the model isn't present.

## Demand forecasting

### Generate synthetic demand data

```bash
cd ml
.venv/bin/python generate_synthetic_demand.py --rows 100000
# -> data/synthetic_demand.csv
```

Format: `[date, crop, region, demand_kg]` (20 crops, 5 regions, 2 years, with seasonality, day-of-week, festival, and growth effects).

### Train the demand forecasting model

```bash
cd ml
export DYLD_LIBRARY_PATH="/opt/homebrew/opt/libomp/lib:$DYLD_LIBRARY_PATH"
.venv/bin/python train_demand_forecast.py
```

Current results (synthetic data, 3-month holdout, log-transformed target):
- **RMSE:** 116,019 kg
- **MAE:** 71,421 kg
- **MAPE:** 40.1%

The model predicts next-day demand from lag/rolling/calendar features; the serving module performs recursive multi-step forecasting to produce 7-day and 30-day horizons with confidence intervals.

### Serve / integrate

`POST /matching/demand-forecast` calls `forecast_demand()` in `backend/app/ml/serve.py`, which returns 7-day and 30-day demand predictions with confidence. Falls back to a deterministic estimate if the model isn't present.

## Status

- ✅ Task 1 (Planning) — complete
- ✅ Synthetic data generated (prices + demand)
- ✅ Price prediction prototype trained + wired into backend
- ✅ Demand forecasting prototype trained + wired into backend
- ⏳ Buyer matching — simplified weighted scoring (next)

## Demo priority

Per SIH Demo Prioritization:
- ✅ **Price Prediction = MUST-HAVE** (done)
- ✅ Demand Forecasting = prototype done (was CUT if behind; now delivered ahead of schedule)
- ⚠️ Buyer Matching = simplify to basic filter if needed
