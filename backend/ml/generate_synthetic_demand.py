"""
ByteFrost — Synthetic Demand Data Generator

Generates realistic synthetic demand data (kg/day) by crop-region for
demand forecasting prototyping. This unblocks the demand forecasting model
while real order data accumulates on the platform.

Output format:
    CSV: [date, crop, region, demand_kg]

Data realism:
    - Per-crop base daily demand and seasonality (harvest cycles)
    - Per-region population/consumption multiplier
    - Day-of-week effect (weekends higher for retail)
    - Festival spikes (Diwali, Holi, etc.)
    - Long-term growth trend
    - Weekly noise + occasional demand shocks

Usage:
    python generate_synthetic_demand.py [--rows N] [--out path]
"""

import argparse
from datetime import date, timedelta

import numpy as np
import pandas as pd

# --- Crop base daily demand (kg) and seasonality ---
CROPS = {
    "tomato":      {"base": 120000, "peak_month": 3,  "amp": 0.30},
    "potato":      {"base": 180000, "peak_month": 1,  "amp": 0.20},
    "onion":       {"base": 150000, "peak_month": 9,  "amp": 0.35},
    "wheat":       {"base": 200000, "peak_month": 4,  "amp": 0.15},
    "rice":        {"base": 220000, "peak_month": 11, "amp": 0.15},
    "maize":       {"base": 90000,  "peak_month": 10, "amp": 0.20},
    "brinjal":     {"base": 70000,  "peak_month": 6,  "amp": 0.25},
    "cauliflower": {"base": 60000,  "peak_month": 12, "amp": 0.30},
    "cabbage":     {"base": 65000,  "peak_month": 12, "amp": 0.25},
    "chilli":      {"base": 40000,  "peak_month": 7,  "amp": 0.35},
    "turmeric":    {"base": 25000,  "peak_month": 2,  "amp": 0.20},
    "ginger":      {"base": 30000,  "peak_month": 1,  "amp": 0.25},
    "banana":      {"base": 140000, "peak_month": 8,  "amp": 0.20},
    "mango":       {"base": 80000,  "peak_month": 5,  "amp": 0.45},
    "apple":       {"base": 50000,  "peak_month": 9,  "amp": 0.30},
    "orange":      {"base": 70000,  "peak_month": 11, "amp": 0.25},
    "grapes":      {"base": 45000,  "peak_month": 4,  "amp": 0.35},
    "pomegranate": {"base": 30000,  "peak_month": 10, "amp": 0.25},
    "groundnut":   {"base": 35000,  "peak_month": 9,  "amp": 0.20},
    "soybean":     {"base": 40000,  "peak_month": 10, "amp": 0.20},
}

# --- Regions (consumption multipliers) ---
REGIONS = {
    "North India":   1.10,
    "South India":   1.05,
    "East India":    0.90,
    "West India":    1.00,
    "Central India": 0.85,
}

# --- Festival calendar (date -> demand multiplier) ---
# Approximate 2024-2026 Indian festival dates (Diwali, Holi, etc.)
FESTIVALS = {
    "2024-10-31": 1.35,  # Diwali 2024
    "2025-03-14": 1.20,  # Holi 2025
    "2025-10-20": 1.35,  # Diwali 2025
    "2026-03-03": 1.20,  # Holi 2026
    "2026-11-08": 1.35,  # Diwali 2026
    "2024-08-15": 1.15,  # Independence Day
    "2025-08-15": 1.15,
    "2026-08-15": 1.15,
    "2024-12-25": 1.10,  # Christmas
    "2025-12-25": 1.10,
    "2026-12-25": 1.10,
}


def seasonality_factor(month: int, peak_month: int, amp: float) -> float:
    """Sinusoidal seasonality peaking at harvest month."""
    phase = 2 * np.pi * (peak_month - 1) / 12.0
    return 1.0 + amp * np.sin(2 * np.pi * (month - 1) / 12.0 - phase + np.pi / 2)


def generate(rows: int = 100_000, seed: int = 7) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    start = date(2024, 8, 1)
    end = date(2026, 8, 1)
    total_days = (end - start).days

    crop_names = list(CROPS.keys())
    region_names = list(REGIONS.keys())

    # Precompute festival multipliers by date
    festival_map = {pd.Timestamp(k).date(): v for k, v in FESTIVALS.items()}

    records = []
    for _ in range(rows):
        crop = rng.choice(crop_names)
        region = rng.choice(region_names)
        day_offset = rng.integers(0, total_days)
        d = start + timedelta(days=int(day_offset))
        month = d.month
        dow = d.weekday()  # 0=Mon ... 6=Sun

        meta = CROPS[crop]
        base = meta["base"]
        amp = meta["amp"]
        peak = meta["peak_month"]

        # Long-term growth trend (~10% per year)
        years_since = (d - start).days / 365.0
        trend = 1.0 + 0.10 * years_since

        # Seasonality
        season = seasonality_factor(month, peak, amp)

        # Region multiplier
        region_mult = REGIONS[region]

        # Day-of-week effect (weekends higher for retail demand)
        dow_mult = 1.0 + 0.15 * (1 if dow >= 5 else 0)

        # Festival spike
        fest_mult = festival_map.get(d, 1.0)

        # Noise + occasional demand shock
        noise = rng.normal(0, 0.08)
        shock = 1.0
        if rng.random() < 0.01:  # 1% demand shock events
            shock = rng.uniform(0.8, 1.25)

        demand = base * trend * season * region_mult * dow_mult * fest_mult * (1 + noise) * shock
        demand = max(demand, base * 0.3)

        records.append(
            {
                "date": d.isoformat(),
                "crop": crop,
                "region": region,
                "demand_kg": round(float(demand), 1),
            }
        )

    df = pd.DataFrame(records)
    df = df.sort_values(["date", "crop", "region"]).reset_index(drop=True)
    return df


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic demand data")
    parser.add_argument("--rows", type=int, default=100_000, help="Number of rows")
    parser.add_argument("--out", type=str, default="data/synthetic_demand.csv")
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()

    df = generate(args.rows, args.seed)
    import os
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    df.to_csv(args.out, index=False)
    print(f"Generated {len(df):,} rows -> {args.out}")
    print(df.head(10).to_string(index=False))
    print("\nSummary:")
    print(f"  Crops: {df['crop'].nunique()}")
    print(f"  Regions: {df['region'].nunique()}")
    print(f"  Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"  Demand range: {df['demand_kg'].min():.0f} - {df['demand_kg'].max():.0f} kg")


if __name__ == "__main__":
    main()
