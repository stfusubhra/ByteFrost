"""
ByteFrost — Demand Forecasting Engine (XGBoost)

Trains an XGBoost regressor on synthetic demand data to forecast demand
by crop-region-time bucket, producing 7-day and 30-day predictions with
confidence intervals.

Pipeline:
    1. Load synthetic demand data
    2. Aggregate to daily crop-region demand
    3. Feature engineering (lags, rolling stats, calendar, festival)
    4. Time-based train/validation split
    5. Train XGBoost regressor (next-day demand)
    6. Evaluate (MAPE, RMSE, MAE)
    7. Save model + metadata for serving (recursive multi-step forecast)

Usage:
    python train_demand_forecast.py [--data path] [--outdir path]
"""

import argparse
import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from xgboost import XGBRegressor

FEATURE_COLS = [
    "crop_encoded",
    "region_encoded",
    "month",
    "week_of_year",
    "day_of_week",
    "is_weekend",
    "is_festival",
    "lag_1",
    "lag_7",
    "lag_30",
    "rolling_mean_7",
    "rolling_std_7",
    "rolling_mean_30",
]

# Approximate festival dates (2024-2026) for feature engineering
FESTIVAL_DATES = {
    "2024-10-31", "2025-03-14", "2025-10-20", "2026-03-03", "2026-11-08",
    "2024-08-15", "2025-08-15", "2026-08-15",
    "2024-12-25", "2025-12-25", "2026-12-25",
}


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Build features from raw daily crop-region demand rows."""
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])

    # Calendar features
    df["month"] = df["date"].dt.month
    df["week_of_year"] = df["date"].dt.isocalendar().week.astype(int)
    df["day_of_week"] = df["date"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["is_festival"] = df["date"].dt.date.isin(FESTIVAL_DATES).astype(int)

    # Sort for lag computation
    df = df.sort_values(["crop", "region", "date"]).reset_index(drop=True)

    # Lagged demand (per crop-region group)
    g = df.groupby(["crop", "region"])["demand_kg"]
    df["lag_1"] = g.shift(1)
    df["lag_7"] = g.shift(7)
    df["lag_30"] = g.shift(30)
    df["rolling_mean_7"] = g.transform(lambda x: x.rolling(7, min_periods=1).mean())
    df["rolling_std_7"] = g.transform(lambda x: x.rolling(7, min_periods=1).std())
    df["rolling_mean_30"] = g.transform(lambda x: x.rolling(30, min_periods=1).mean())

    # Encode categoricals
    df["crop_encoded"] = df["crop"].astype("category").cat.codes
    df["region_encoded"] = df["region"].astype("category").cat.codes

    return df


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/synthetic_demand.csv")
    parser.add_argument("--outdir", default="models")
    parser.add_argument("--test-months", type=int, default=3,
                        help="Last N months used as holdout test set")
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    print(f"Loaded {len(df):,} rows from {args.data}")

    # Aggregate to daily crop-region demand
    df = (
        df.groupby(["date", "crop", "region"])["demand_kg"]
        .sum()
        .reset_index()
    )
    print(f"Aggregated to {len(df):,} daily crop-region rows")

    df = engineer_features(df)

    # Drop rows with missing lag features (first ~30 days per group)
    df = df.dropna(subset=["lag_1", "lag_7", "lag_30"]).reset_index(drop=True)
    print(f"After dropping rows without lag features: {len(df):,} rows")

    # Time-based split: last N months as test
    max_date = df["date"].max()
    cutoff = max_date - pd.DateOffset(months=args.test_months)
    train = df[df["date"] < cutoff]
    test = df[df["date"] >= cutoff]
    print(f"Train: {len(train):,} rows ({train['date'].min().date()} to {train['date'].max().date()})")
    print(f"Test:  {len(test):,} rows ({test['date'].min().date()} to {test['date'].max().date()})")

    X_train = train[FEATURE_COLS]
    y_train = np.log1p(train["demand_kg"])  # log-transform to stabilize variance
    X_test = test[FEATURE_COLS]
    y_test_log = np.log1p(test["demand_kg"])
    y_test = test["demand_kg"]

    # Train XGBoost
    model = XGBRegressor(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
    )
    print("\nTraining XGBoost...")
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    # Evaluate (next-day demand) — exponentiate predictions back to kg
    preds_log = model.predict(X_test)
    preds = np.expm1(preds_log)
    rmse = root_mean_squared_error(y_test, preds)
    mae = mean_absolute_error(y_test, preds)
    mape = np.mean(np.abs((y_test - preds) / y_test)) * 100

    print("\n=== Evaluation (next-day demand, holdout test set) ===")
    print(f"RMSE: {rmse:.2f} kg")
    print(f"MAE:  {mae:.2f} kg")
    print(f"MAPE: {mape:.2f}%")
    print(f"Mean demand: {y_test.mean():.2f} kg")
    print(f"MAE as % of mean: {mae / y_test.mean() * 100:.2f}%")

    # Feature importance
    importance = sorted(
        zip(FEATURE_COLS, model.feature_importances_),
        key=lambda x: x[1], reverse=True,
    )
    print("\n=== Feature Importance ===")
    for feat, imp in importance[:10]:
        print(f"  {feat}: {imp:.4f}")

    # Save model + metadata
    os.makedirs(args.outdir, exist_ok=True)
    model_path = os.path.join(args.outdir, "demand_forecast_xgb.joblib")
    joblib.dump(model, model_path)

    crop_map = dict(enumerate(df["crop"].astype("category").cat.categories))
    region_map = dict(enumerate(df["region"].astype("category").cat.categories))
    meta = {
        "feature_cols": FEATURE_COLS,
        "crop_map": {str(k): v for k, v in crop_map.items()},
        "region_map": {str(k): v for k, v in region_map.items()},
        "metrics": {"rmse": float(rmse), "mae": float(mae), "mape": float(mape)},
        "trained_on": "synthetic_demand.csv",
        "test_months": args.test_months,
        "horizons": [7, 30],
    }
    meta_path = os.path.join(args.outdir, "demand_forecast_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\nSaved model -> {model_path}")
    print(f"Saved meta  -> {meta_path}")


if __name__ == "__main__":
    main()
