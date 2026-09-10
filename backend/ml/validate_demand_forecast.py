"""
ByteFrost — Demand Forecasting with Walk-Forward Validation

Implements proper time-series cross-validation for the demand forecasting model.
Uses walk-forward validation (expanding window) to evaluate model performance
across different time periods, simulating real-world forecasting conditions.

Pipeline:
    1. Load synthetic demand data
    2. Aggregate to daily crop-region demand
    3. Feature engineering (lags, rolling stats, calendar features)
    4. Walk-forward validation with expanding windows
    5. Train XGBoost on each training fold
    6. Evaluate on holdout periods
    7. Aggregate metrics across all folds
    8. Train final model on full dataset

Usage:
    python validate_demand_forecast.py [--data path] [--min-training-days N]
"""

import argparse
import json
import os
from datetime import date, timedelta

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
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


def walk_forward_validation(df: pd.DataFrame, min_training_days: int = 90):
    """
    Perform walk-forward validation with expanding windows.

    Returns list of (train_mask, test_mask) tuples.
    """
    # Group by crop-region
    groups = df.groupby(["crop", "region"])
    validation_folds = []

    for (crop, region), group_df in groups:
        group_df = group_df.sort_values("date").reset_index(drop=True)
        if len(group_df) < min_training_days * 2:
            continue  # Need at least 2x min_training_days for meaningful validation

        dates = group_df["date"].values
        n = len(dates)

        # Create expanding window splits
        # Use last 30% as initial test, then slide forward
        test_start_idx = int(n * 0.3)
        step_size = max(7, n // 10)  # Slide by ~10% or at least 7 days

        for start_idx in range(test_start_idx, n - 7, step_size):
            end_idx = min(start_idx + 30, n)  # 30-day test windows

            train_mask = np.zeros(n, dtype=bool)
            test_mask = np.zeros(n, dtype=bool)

            train_mask[:start_idx] = True
            test_mask[start_idx:end_idx] = True

            validation_folds.append({
                "crop": crop,
                "region": region,
                "train_dates": (dates[train_mask][0], dates[train_mask][-1]),
                "test_dates": (dates[test_mask][0], dates[test_mask][-1]),
                "train_size": train_mask.sum(),
                "test_size": test_mask.sum(),
            })

    return validation_folds


def evaluate_model(X_train, y_train, X_test, y_test, model_params=None):
    """Train and evaluate a single model fold."""
    if model_params is None:
        model_params = {
            "n_estimators": 400,
            "max_depth": 6,
            "learning_rate": 0.05,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42,
            "n_jobs": -1,
        }

    model = XGBRegressor(**model_params)
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    preds_log = model.predict(X_test)
    # Clip extreme values to prevent overflow
    preds_log = np.clip(preds_log, -50, 50)
    preds = np.expm1(preds_log)
    
    # Actual values are already in original scale (not log-transformed)
    actual = np.array(y_test)

    rmse = np.sqrt(mean_squared_error(actual, preds))
    mae = mean_absolute_error(actual, preds)
    mape = np.mean(np.abs((actual - preds) / (actual + 1e-9))) * 100

    return {
        "rmse": rmse,
        "mae": mae,
        "mape": mape,
        "mean_actual": float(actual.mean()),
        "mae_pct_of_mean": mae / actual.mean() * 100 if actual.mean() > 0 else 0,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/synthetic_demand.csv")
    parser.add_argument("--outdir", default="models")
    parser.add_argument("--min-training-days", type=int, default=90,
                        help="Minimum training period in days")
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
    print(f"After feature engineering: {len(df):,} rows")

    # Drop rows with missing lag features
    df = df.dropna(subset=["lag_1", "lag_7", "lag_30"]).reset_index(drop=True)
    print(f"After dropping rows without lag features: {len(df):,} rows")

    # Walk-forward validation
    print("\n=== Walk-Forward Validation (Expanding Window) ===")
    validation_folds = walk_forward_validation(df, min_training_days=args.min_training_days)
    print(f"Generated {len(validation_folds)} validation folds\n")

    all_metrics = []
    fold_metrics = []

    for i, fold in enumerate(validation_folds):
        train_mask = (df["date"].between(fold["train_dates"][0], fold["train_dates"][1]))
        test_mask = (df["date"].between(fold["test_dates"][0], fold["test_dates"][1]))

        X_train = df.loc[train_mask, FEATURE_COLS]
        y_train = np.log1p(df.loc[train_mask, "demand_kg"])
        X_test = df.loc[test_mask, FEATURE_COLS]
        y_test = df.loc[test_mask, "demand_kg"]

        if len(X_train) < 100 or len(X_test) < 10:
            continue  # Skip folds with insufficient data

        metrics = evaluate_model(X_train, y_train, X_test, y_test)
        metrics["fold"] = i + 1
        metrics["crop"] = fold["crop"]
        metrics["region"] = fold["region"]
        metrics["train_size"] = fold["train_size"]
        metrics["test_size"] = fold["test_size"]

        all_metrics.append(metrics)
        fold_metrics.append(metrics)

        if (i + 1) % 10 == 0:
            print(f"  Completed fold {i + 1}/{len(validation_folds)}...")

    # Aggregate results
    if fold_metrics:
        agg_metrics = {
            "rmse_mean": np.mean([m["rmse"] for m in fold_metrics]),
            "rmse_std": np.std([m["rmse"] for m in fold_metrics]),
            "mae_mean": np.mean([m["mae"] for m in fold_metrics]),
            "mae_std": np.std([m["mae"] for m in fold_metrics]),
            "mape_mean": np.mean([m["mape"] for m in fold_metrics]),
            "mape_std": np.std([m["mape"] for m in fold_metrics]),
            "mae_pct_mean": np.mean([m["mae_pct_of_mean"] for m in fold_metrics]),
            "num_folds": len(fold_metrics),
        }

        print("\n=== Walk-Forward Validation Results (Aggregated) ===")
        print(f"Number of folds: {agg_metrics['num_folds']}")
        print(f"RMSE:   {agg_metrics['rmse_mean']:.2f} ± {agg_metrics['rmse_std']:.2f} kg")
        print(f"MAE:    {agg_metrics['mae_mean']:.2f} ± {agg_metrics['mae_std']:.2f} kg")
        print(f"MAPE:   {agg_metrics['mape_mean']:.2f}% ± {agg_metrics['mape_std']:.2f}%")
        print(f"MAE as % of mean demand: {agg_metrics['mae_pct_mean']:.2f}%")

        # Save validation results
        os.makedirs(args.outdir, exist_ok=True)
        validation_result_path = os.path.join(args.outdir, "demand_forecast_validation.json")
        with open(validation_result_path, "w") as f:
            json.dump({
                "validation_method": "walk_forward_expanding_window",
                "metrics": agg_metrics,
                "fold_details": fold_metrics,
            }, f, indent=2, default=str)
        print(f"\nSaved validation results -> {validation_result_path}")

    # Train final model on full dataset
    print("\n=== Training Final Model on Full Dataset ===")
    max_date = df["date"].max()
    cutoff = max_date - pd.DateOffset(months=3)  # Last 3 months as test
    train = df[df["date"] < cutoff]
    test = df[df["date"] >= cutoff]

    X_train = train[FEATURE_COLS]
    y_train = np.log1p(train["demand_kg"])
    X_test = test[FEATURE_COLS]
    y_test = test["demand_kg"]

    model = XGBRegressor(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    preds_log = model.predict(X_test)
    preds = np.expm1(preds_log)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mae = mean_absolute_error(y_test, preds)
    mape = np.mean(np.abs((y_test - preds) / (y_test + 1e-9))) * 100

    print(f"\nFinal Model Evaluation (Last 3 months holdout):")
    print(f"  RMSE: {rmse:.2f} kg")
    print(f"  MAE:  {mae:.2f} kg")
    print(f"  MAPE: {mape:.2f}%")
    print(f"  Mean demand: {y_test.mean():.2f} kg")

    # Feature importance
    importance = sorted(
        zip(FEATURE_COLS, model.feature_importances_),
        key=lambda x: x[1], reverse=True,
    )
    print("\n=== Feature Importance (Top 10) ===")
    for feat, imp in importance[:10]:
        print(f"  {feat}: {imp:.4f}")

    # Save model + metadata
    model_path = os.path.join(args.outdir, "demand_forecast_xgb.joblib")
    joblib.dump(model, model_path)

    crop_map = dict(enumerate(df["crop"].astype("category").cat.categories))
    region_map = dict(enumerate(df["region"].astype("category").cat.categories))
    meta = {
        "feature_cols": FEATURE_COLS,
        "crop_map": {str(k): v for k, v in crop_map.items()},
        "region_map": {str(k): v for k, v in region_map.items()},
        "metrics": {"rmse": float(rmse), "mae": float(mae), "mape": float(mape)},
        "validation_method": "walk_forward_expanding_window",
        "trained_on": "synthetic_demand.csv",
        "horizons": [7, 30],
    }
    meta_path = os.path.join(args.outdir, "demand_forecast_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\nSaved model -> {model_path}")
    print(f"Saved meta  -> {meta_path}")


if __name__ == "__main__":
    main()
