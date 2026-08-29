"""
ByteFrost — Price Prediction Prototype (XGBoost)

Trains an XGBoost regressor on synthetic mandi price data to predict
a recommended price band for a produce listing.

This is the DEMO MUST-HAVE AI feature.

Pipeline:
    1. Load synthetic mandi price data
    2. Feature engineering (seasonality, lagged prices, crop/mandi encoding)
    3. Time-based train/validation split
    4. Train XGBoost regressor
    5. Evaluate (RMSE, MAE)
    6. Save model + feature metadata for serving

Usage:
    python train_price_prediction.py [--data path] [--outdir path]
"""

import argparse
import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from sklearn.model_selection import TimeSeriesSplit
from xgboost import XGBRegressor

FEATURE_COLS = [
    "crop_encoded",
    "mandi_encoded",
    "month",
    "week_of_year",
    "day_of_year",
    "lag_7",
    "lag_14",
    "lag_30",
    "rolling_mean_7",
    "rolling_std_7",
    "quantity_log",
    "quantity_lag_7",
]


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Build features from raw mandi price rows."""
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])

    # Calendar features
    df["month"] = df["date"].dt.month
    df["week_of_year"] = df["date"].dt.isocalendar().week.astype(int)
    df["day_of_year"] = df["date"].dt.dayofyear

    # Sort for lag computation
    df = df.sort_values(["crop", "mandi", "date"]).reset_index(drop=True)

    # Lagged prices (per crop-mandi group)
    g = df.groupby(["crop", "mandi"])["price_per_quintal"]
    df["lag_7"] = g.shift(7)
    df["lag_14"] = g.shift(14)
    df["lag_30"] = g.shift(30)
    df["rolling_mean_7"] = g.transform(lambda x: x.rolling(7, min_periods=1).mean())
    df["rolling_std_7"] = g.transform(lambda x: x.rolling(7, min_periods=1).std())

    # Quantity features
    df["quantity_log"] = np.log1p(df["quantity"])
    df["quantity_lag_7"] = df.groupby(["crop", "mandi"])["quantity_log"].shift(7)

    # Encode categoricals
    df["crop_encoded"] = df["crop"].astype("category").cat.codes
    df["mandi_encoded"] = df["mandi"].astype("category").cat.codes

    return df


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/synthetic_mandi_prices.csv")
    parser.add_argument("--outdir", default="models")
    parser.add_argument("--test-months", type=int, default=3,
                        help="Last N months used as holdout test set")
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    print(f"Loaded {len(df):,} rows from {args.data}")

    df = engineer_features(df)

    # Drop rows with missing lag features (first ~30 days per group)
    df = df.dropna(subset=["lag_7", "lag_14", "lag_30", "quantity_lag_7"]).reset_index(drop=True)
    print(f"After dropping rows without lag features: {len(df):,} rows")

    # Time-based split: last N months as test
    max_date = df["date"].max()
    cutoff = max_date - pd.DateOffset(months=args.test_months)
    train = df[df["date"] < cutoff]
    test = df[df["date"] >= cutoff]
    print(f"Train: {len(train):,} rows ({train['date'].min().date()} to {train['date'].max().date()})")
    print(f"Test:  {len(test):,} rows ({test['date'].min().date()} to {test['date'].max().date()})")

    X_train = train[FEATURE_COLS]
    y_train = train["price_per_quintal"]
    X_test = test[FEATURE_COLS]
    y_test = test["price_per_quintal"]

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

    # Evaluate
    preds = model.predict(X_test)
    rmse = root_mean_squared_error(y_test, preds)
    mae = mean_absolute_error(y_test, preds)
    mape = np.mean(np.abs((y_test - preds) / y_test)) * 100

    print("\n=== Evaluation (holdout test set) ===")
    print(f"RMSE: {rmse:.2f} Rs/quintal")
    print(f"MAE:  {mae:.2f} Rs/quintal")
    print(f"MAPE: {mape:.2f}%")
    print(f"Mean price: {y_test.mean():.2f} Rs/quintal")
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
    model_path = os.path.join(args.outdir, "price_prediction_xgb.joblib")
    joblib.dump(model, model_path)

    # Save crop/mandi label mappings for serving
    crop_map = dict(enumerate(df["crop"].astype("category").cat.categories))
    mandi_map = dict(enumerate(df["mandi"].astype("category").cat.categories))
    meta = {
        "feature_cols": FEATURE_COLS,
        "crop_map": {str(k): v for k, v in crop_map.items()},
        "mandi_map": {str(k): v for k, v in mandi_map.items()},
        "metrics": {"rmse": float(rmse), "mae": float(mae), "mape": float(mape)},
        "trained_on": "synthetic_mandi_prices.csv",
        "test_months": args.test_months,
    }
    meta_path = os.path.join(args.outdir, "price_prediction_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\nSaved model -> {model_path}")
    print(f"Saved meta  -> {meta_path}")


if __name__ == "__main__":
    main()
