"""
ByteFrost — Synthetic Mandi Price Data Generator

Generates realistic synthetic APMC mandi price data for ML prototyping.
This unblocks the price prediction model while Aradhya's real data research
is in progress (per the Problem & Strategy risk mitigation plan).

Output format (agreed standard):
    CSV: [date, crop, mandi, price_per_quintal, quantity]

Data realism:
    - Per-crop base price and seasonality (harvest cycles)
    - Per-mandi regional price variation
    - Long-term inflation trend
    - Weekly noise + occasional supply shocks
    - Quantity (arrivals) correlated with season and price

Usage:
    python generate_synthetic_data.py [--rows N] [--out path]
"""

import argparse
import random
from datetime import date, timedelta

import numpy as np
import pandas as pd

# --- Crop definitions: base price (Rs/quintal), seasonality peak month, amplitude ---
# seasonality modeled as a sinusoidal cycle peaking around the harvest month
CROPS = {
    "tomato":      {"base": 1800, "peak_month": 3,  "amp": 0.35, "unit": "quintal"},
    "potato":      {"base": 1400, "peak_month": 1,  "amp": 0.25, "unit": "quintal"},
    "onion":       {"base": 2200, "peak_month": 9,  "amp": 0.40, "unit": "quintal"},
    "wheat":       {"base": 2300, "peak_month": 4,  "amp": 0.20, "unit": "quintal"},
    "rice":        {"base": 2600, "peak_month": 11, "amp": 0.20, "unit": "quintal"},
    "maize":       {"base": 1900, "peak_month": 10, "amp": 0.22, "unit": "quintal"},
    "brinjal":     {"base": 1600, "peak_month": 6,  "amp": 0.30, "unit": "quintal"},
    "cauliflower": {"base": 2100, "peak_month": 12, "amp": 0.35, "unit": "quintal"},
    "cabbage":     {"base": 1500, "peak_month": 12, "amp": 0.30, "unit": "quintal"},
    "chilli":      {"base": 4500, "peak_month": 7,  "amp": 0.45, "unit": "quintal"},
    "turmeric":    {"base": 8000, "peak_month": 2,  "amp": 0.25, "unit": "quintal"},
    "ginger":      {"base": 7000, "peak_month": 1,  "amp": 0.30, "unit": "quintal"},
    "banana":      {"base": 2800, "peak_month": 8,  "amp": 0.20, "unit": "quintal"},
    "mango":       {"base": 3500, "peak_month": 5,  "amp": 0.50, "unit": "quintal"},
    "apple":       {"base": 6000, "peak_month": 9,  "amp": 0.35, "unit": "quintal"},
    "orange":      {"base": 3200, "peak_month": 11, "amp": 0.30, "unit": "quintal"},
    "grapes":      {"base": 4000, "peak_month": 4,  "amp": 0.40, "unit": "quintal"},
    "pomegranate": {"base": 5500, "peak_month": 10, "amp": 0.30, "unit": "quintal"},
    "groundnut":   {"base": 5200, "peak_month": 9,  "amp": 0.25, "unit": "quintal"},
    "soybean":     {"base": 4800, "peak_month": 10, "amp": 0.25, "unit": "quintal"},
}

# --- Mandis (regional price multipliers) ---
MANDIS = {
    "Azadpur, Delhi":      1.15,
    "Vashi, Mumbai":       1.10,
    "Koyambedu, Chennai":  1.05,
    "Bowring, Bengaluru":  1.08,
    "Kothapet, Hyderabad": 1.02,
    "Gultekdi, Pune":      1.00,
    "Kolkata (Sealdah)":   0.98,
    "Ahmedabad":           1.00,
    "Jaipur":              0.95,
    "Lucknow":             0.92,
    "Patna":               0.90,
    "Indore":              0.93,
    "Nagpur":              0.94,
    "Coimbatore":          1.00,
    "Vijayawada":          0.97,
}


def seasonality_factor(month: int, peak_month: int, amp: float) -> float:
    """Sinusoidal seasonality peaking at harvest month."""
    # phase so that peak occurs at peak_month
    phase = 2 * np.pi * (peak_month - 1) / 12.0
    return 1.0 + amp * np.sin(2 * np.pi * (month - 1) / 12.0 - phase + np.pi / 2)


def generate(rows: int = 200_000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    random.seed(seed)

    start = date(2024, 8, 1)
    end = date(2026, 8, 1)
    total_days = (end - start).days

    records = []
    crop_names = list(CROPS.keys())
    mandi_names = list(MANDIS.keys())

    for _ in range(rows):
        crop = rng.choice(crop_names)
        mandi = rng.choice(mandi_names)
        day_offset = rng.integers(0, total_days)
        d = start + timedelta(days=int(day_offset))
        month = d.month

        meta = CROPS[crop]
        base = meta["base"]
        amp = meta["amp"]
        peak = meta["peak_month"]

        # Long-term inflation trend (~8% per year)
        years_since = (d - start).days / 365.0
        trend = 1.0 + 0.08 * years_since

        # Seasonality
        season = seasonality_factor(month, peak, amp)

        # Regional multiplier
        region = MANDIS[mandi]

        # Weekly noise + occasional supply shock
        noise = rng.normal(0, 0.06)
        shock = 1.0
        if rng.random() < 0.02:  # 2% supply shock events
            shock = rng.uniform(0.7, 1.3)

        price = base * trend * season * region * (1 + noise) * shock
        price = max(price, base * 0.4)  # floor

        # Quantity (arrivals in quintals) — inversely related to price spikes,
        # higher in harvest season
        qty_base = rng.uniform(200, 3000)
        qty = qty_base * (0.7 + 0.6 * season) * rng.uniform(0.8, 1.2)
        qty = max(qty, 50)

        records.append(
            {
                "date": d.isoformat(),
                "crop": crop,
                "mandi": mandi,
                "price_per_quintal": round(float(price), 2),
                "quantity": round(float(qty), 1),
            }
        )

    df = pd.DataFrame(records)
    df = df.sort_values("date").reset_index(drop=True)
    return df


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic mandi price data")
    parser.add_argument("--rows", type=int, default=200_000, help="Number of rows")
    parser.add_argument("--out", type=str, default="data/synthetic_mandi_prices.csv")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    df = generate(args.rows, args.seed)
    import os
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    df.to_csv(args.out, index=False)
    print(f"Generated {len(df):,} rows -> {args.out}")
    print(df.head(10).to_string(index=False))
    print("\nSummary:")
    print(f"  Crops: {df['crop'].nunique()}")
    print(f"  Mandis: {df['mandi'].nunique()}")
    print(f"  Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"  Price range: {df['price_per_quintal'].min():.2f} - {df['price_per_quintal'].max():.2f}")


if __name__ == "__main__":
    main()
