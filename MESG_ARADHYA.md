# ⚠️ URGENT: Aradhya — Unblock the Team

Hey Aradhya,

Your task **"Mandi Price Data Collection"** is the critical path for ByteFrost.

## Why You're Blocking the Team

Without your mandi price data, **Agni cannot train the price prediction model** (XGBoost). This model feeds directly into AI endpoint `/matching/price-recommendation`, which we're demonstrating at SIH.

## What We Need From You

Please deliver this by **Aug 27**:

1. **CSV/JSON file** with at least **50 rows** of historical mandi price data:
   - crop_name (e.g., potato, onion, tomato)
   - region/location (e.g., West Bengal, Maharashtra)
   - date_of_sale
   - min_price_per_quintal
   - max_price_per_quintal
   - modal_price_per_quintal
   - quantity_sold_quintals (optional but useful)

2. **At least 5 crop types** covered

3. **At least 3 regions/districts** covered

4. **Feb–Aug 2026** date range preferred (most recent)

## Format (Example)
```csv
crop_name,region,date,min_price,modal_price,max_price,quantity
potato,West Bengal,2026-03-15,800,950,1100,450
onion,Maharashtra,2026-03-15,1200,1400,1600,300
```

## What Agni Will Do With It

1. Train XGBoost regressor on this data
2. Plug model into `POST /matching/price-recommendation`
3. Feature importance analysis → explainable AI for farmers

## While You Work on This

You can also start on:
- **Demand data**: Which crops are most/least demanded in which seasons?
- **Collection pipeline**: How to automate data fetching from agmarknet.gov.in or similar sources?

---

**Deadline: Aug 27, 2026 (Tomorrow)**
Please confirm receipt and estimated delivery time.

Tag Subhra if you get stuck.