# ByteFrost — AI/ML Planning (Task 1)

> **Owner:** Agni Pratap Pramanik (AI/ML)
> **Sprint:** Sprint 1 (Aug 26–31, 2026)
> **Task:** AI model training — Phase 1 Exploration & Planning
> **Status:** ✅ Complete (Aug 28, 2026)

This document is the Phase 1 planning deliverable for the ByteFrost AI/ML workstream. It covers the ML stack decision, training data sources, model architecture for all three models, and compute/time estimates.

---

## 1. ML Stack Decision

### Chosen stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Price Prediction** | XGBoost Regressor | Strong tabular performance, handles non-linearity, built-in feature importance, fast training on CPU |
| **Demand Forecasting** | XGBoost with lag features (primary); Prophet as fallback | XGBoost integrates with the same feature pipeline; Prophet for strong seasonality/festival handling |
| **Buyer Matching** | Weighted scoring / ranking (scikit-learn) | Interpretable, explainable for demo; no heavy training needed |
| **Feature engineering** | pandas + numpy | Standard, well-documented |
| **Model evaluation** | scikit-learn metrics (RMSE, MAE, MAPE) | Consistent across models |
| **Experimentation** | Jupyter notebooks | Iterative prototyping before service integration |
| **Model serving** | Pickle / joblib serialization → FastAPI service | Lightweight, no extra infra |

### Version pins (from `backend/requirements.txt`)
- `pandas==2.2.0`, `numpy==1.26.0`, `scikit-learn==1.5.0`, `xgboost==2.1.0`
- Local env uses Python 3.13 with newer versions (pandas 3.0.5, scikit-learn 1.9.0, xgboost 3.4.1) for prototyping; will align pins before service integration.

### Why XGBoost over deep learning
- Dataset is small-to-medium tabular (mandi prices, listings, orders) — tree ensembles dominate.
- No GPU needed; trains in seconds-to-minutes on CPU.
- Explainability via feature importance + SHAP (a stated future improvement).
- Fast to iterate for a 10-day sprint.

---

## 2. Training Data Sources

### Primary: Mandi (APMC) price data — **BLOCKING** (Aradhya's research, due Aug 27)

| Source | Type | What we need | Status |
|--------|------|--------------|--------|
| [data.gov.in](https://data.gov.in) — Mandi Prices dataset | Historical CSV | Last 2 years, top 20 crops, by mandi: `[date, crop, mandi, price_per_quintal, quantity]` | Aradhya researching |
| [mandis.gov.in](https://mandis.gov.in) | Government portal | Real-time + historical APMC prices | Aradhya researching |
| eNAM API | API | Real-time mandi prices across states | Aradhya researching |

**Fallback (per Problem & Strategy risk mitigation):** Use **synthetic data** for prototyping now; swap in real data when Aradhya delivers. Agni is cleared to start with synthetic data.

### Secondary / enrichment sources
- **Weather:** OpenWeatherMap API (rainfall, temperature) — optional demand feature
- **Crop production:** Ministry of Agriculture data
- **Internal platform data:** listings, orders, allocations (once live) — for demand forecasting and buyer matching

### Data format standard (agreed)
```
CSV: [date, crop, mandi, price_per_quintal, quantity]
```

---

## 3. Model Architecture

### 3.1 Price Prediction (MUST-HAVE for demo)

**Endpoint:** `POST /matching/price-recommendation`

**Inputs (from Price Prediction page):**
- Historical prices
- Demand forecast
- Nearby supply and inventory
- Quality grade
- Transport distance and costs

**Features:**
- Demand-supply ratio by crop-region
- Lagged price and trend features (t-1, t-7, t-30)
- Quality grade encoding (A/B/C)
- Distance and logistics cost proxies
- Seasonality (month, week-of-year)

**Model:** XGBoost Regressor (with linear baseline for explainability)

**Output:**
```json
{
  "listing_id": "...",
  "recommended_price": 25.0,
  "confidence": 0.75,
  "price_band": {"low": 20.0, "mid": 25.0, "high": 30.0},
  "factors": ["historical_mandi_prices", "demand_signal", "seasonality"]
}
```

**Evaluation:** RMSE, MAE, calibration of predicted intervals
**Validation:** Time-based split; segment by crop and region

### 3.2 Demand Forecasting (CUT if behind — defer to post-SIH)

**Endpoint:** `POST /matching/demand-forecast`

**Features:**
- Lag features (t-1, t-7, t-30)
- Rolling averages and volatility
- Calendar features (month, week, festivals)
- Weather features (rainfall, temperature)

**Model:** XGBoost with lag features (primary); Prophet/SARIMAX fallback

**Output:** 7-day and 30-day demand predictions per crop-region-time bucket, with confidence interval

**Evaluation:** MAPE, RMSE, MAE
**Validation:** Time-based split; backtesting across multiple windows

### 3.3 Buyer Matching (simplify to basic filter if needed)

**Endpoint:** `POST /matching/find-matches`

**Scoring methodology (from Buyer Matching page):**
1. **Hard constraints filter:** availability window overlap, minimum quantity, deadlines
2. **Weighted scoring:** quantity fit, price score, distance score, reliability score, deadline risk score, urgency boost

**Model:** Weighted scoring / ranking (scikit-learn) — interpretable

**Output:** Ranked candidates with explanation fields

---

## 4. Training Time & Compute Requirements

### Compute
- **CPU-only** is sufficient for all three models (no GPU needed).
- Local dev machine: any modern laptop CPU.
- No cloud GPU required for the demo.

### Estimated training times (synthetic + real data, ~2 years × 20 crops × ~500 mandis)

| Model | Dataset size (est.) | Training time | Notes |
|-------|--------------------|---------------|-------|
| Price Prediction (XGBoost) | ~200k–500k rows | 1–5 min | Fast on CPU; grid search adds time |
| Demand Forecasting (XGBoost) | ~50k–200k rows | 1–3 min | Per crop-region segments |
| Buyer Matching (weighted) | N/A (no training) | < 1 min | Scoring only |

### Memory
- < 4 GB RAM for all models. No special requirements.

### Serving
- Serialize models with `joblib`/`pickle`, load into FastAPI service.
- Model versioning + experiment tracking recommended (see ML Experiments DB in Notion).

---

## 5. Next Steps (Phase 2 — Prototyping, Aug 29+)

1. Generate synthetic mandi price data (unblock price prediction).
2. Build Jupyter notebook: `backend/ml/notebooks/price_prediction.ipynb` — train + evaluate XGBoost.
3. Build demand forecasting notebook (if time permits).
4. Build buyer matching scoring module.
5. Plug trained models into `backend/app/api/matching.py` (replace stubs).
6. Log experiments in Notion ML Experiments DB.

---

## 6. Demo Priority Alignment

Per SIH Demo Prioritization (Problem & Strategy):
- ✅ **Price Prediction = MUST-HAVE** — top AI priority
- ⚠️ **Demand Forecasting = CUT if behind** — defer to post-SIH
- ⚠️ **Buyer Matching = simplify to basic filter** if needed

**Rule:** Demo works first, perfection comes after.
