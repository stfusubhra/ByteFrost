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
├── data/
│   └── synthetic_mandi_prices.csv # Generated synthetic data (200k rows)
├── models/
│   ├── price_prediction_xgb.joblib  # Trained XGBoost model
│   └── price_prediction_meta.json   # Feature + label mappings, metrics
├── notebooks/                     # Jupyter notebooks (prototyping)
└── .venv/                         # Python virtual environment (Python 3.13)
```

The serving module lives in the backend so FastAPI can call it:
```
backend/app/ml/serve.py            # Loads models, exposes recommend_price()
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

## Status

- ✅ Task 1 (Planning) — complete
- ✅ Synthetic data generated
- ✅ Price prediction prototype trained + wired into backend
- ⏳ Demand forecasting — deferred (CUT if behind per demo priorities)
- ⏳ Buyer matching — simplified weighted scoring (next)

## Demo priority

Per SIH Demo Prioritization:
- ✅ **Price Prediction = MUST-HAVE** (done)
- ⚠️ Demand Forecasting = CUT if behind
- ⚠️ Buyer Matching = simplify to basic filter if needed
