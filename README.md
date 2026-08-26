# ByteFrost

> AI-powered direct farm-to-market supply-chain platform
> SIH 2026 — Problem Statement 26033

## Problem

Multiple intermediaries reduce farmers' earnings and increase consumer prices. The current 4-layer supply chain (Farmer → Aggregator → Wholesaler → Retailer → Consumer) creates margin stacking, price opacity, and inefficiency.

## Solution

An AI-powered platform connecting farmers and FPOs directly with buyers and consumers, featuring:

- **Direct Marketplace** — Farmers list produce, buyers discover and order
- **AI Matching** — Smart buyer-seller matching with scoring and allocation
- **Price Prediction** — AI-powered price recommendations based on historical data
- **Demand Forecasting** — Predict demand by crop, region, and time window
- **Logistics Optimization** — Route optimization using Google OR-Tools
- **Delivery Tracking** — End-to-end shipment visibility

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL, Redis |
| AI/ML | scikit-learn, XGBoost, Pandas |
| Logistics | Google OR-Tools, Google Maps API |
| Deployment | Vercel, Railway/Render, Supabase |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.12+
- Node.js 20+

### 1. Clone & Start

```bash
git clone https://github.com/your-org/bytefrost.git
cd bytefrost

# Copy environment config
cp .env.example .env

# Start everything with Docker
docker-compose up
```

### 2. Access

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

### 3. Manual Setup (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
bytefrost/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   ├── core/           # Config, database, security
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── ml/             # ML model serving
│   ├── tests/              # Backend tests
│   ├── alembic/            # Database migrations
│   └── requirements.txt
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js app router pages
│   │   ├── components/     # Reusable UI components
│   │   ├── lib/            # API client, utilities
│   │   └── store/          # Zustand state management
│   └── package.json
├── ml/                     # ML training notebooks & models
├── docs/                   # Architecture & design docs
├── docker-compose.yml
└── .github/workflows/      # CI/CD
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/listings` | Create produce listing |
| GET | `/api/v1/listings` | Browse marketplace |
| POST | `/api/v1/orders` | Place order |
| POST | `/api/v1/matching/find-matches` | AI buyer matching |
| POST | `/api/v1/matching/price-recommendation` | Price recommendation |
| POST | `/api/v1/matching/demand-forecast` | Demand forecast |
| POST | `/api/v1/logistics/optimize-route` | Route optimization |

## Team

| Name | Role | GitHub |
|------|------|--------|
| Subhra Dey | Backend / Product | @stfusubhra |
| Aradhya Bandyopadhyay | Research / Data | @rio4508 |
| Ankit Chakraborty | Logistics | @Ankyytt284 |
| Moupriya Ghosh | Frontend / Design | @moupriya2803 |
| Agni Pratap Pramanik | AI/ML / Data | — |
| Rajika Pramanick | Presentation / Testing | — |
| Subhra Dey (DevOps) | DevOps / Integration | @stfusubhra |

## License

Private — SIH 2026
