# ByteFrost / KisanSetu

> AI-Powered Direct Farm-to-Market Supply Chain Platform
> **SIH 2026 — Problem Statement 26033**

[![Repository](https://img.shields.io/badge/GitHub-stfusubhra%2FByteFrost-181717?logo=github)](https://github.com/stfusubhra/ByteFrost)
[![CI](https://github.com/stfusubhra/ByteFrost/actions/workflows/ci.yml/badge.svg)](https://github.com/stfusubhra/ByteFrost/actions/workflows/ci.yml)
[![Live Web Application](https://img.shields.io/badge/Vercel-KisanSetu%20App-000000?logo=vercel)](https://kisansetu-bay.vercel.app/)
[![Backend API Status](https://img.shields.io/badge/Render-FastAPI%20Backend-46E3B7?logo=render)](https://bytefrost-backend.onrender.com/health)

---

## 🌾 Problem Statement

Multiple intermediaries reduce farmers' earnings while increasing end-consumer prices. The traditional 4-layer agricultural supply chain (**Farmer → Aggregator → Wholesaler → Retailer → Consumer**) creates margin stacking, price opacity, high post-harvest loss, and routing inefficiencies.

## 🚀 Solution

**ByteFrost / KisanSetu** is a direct farm-to-market platform connecting farmers and Farmer Producer Organizations (FPOs) directly with bulk buyers and consumers.

- **Direct Marketplace** — Public produce discovery with real-time listings, quality grade badges, and verified seller locations.
- **Explainable AI Matching** — Multi-factor buyer-seller matching with transparent scoring breakdown (*Quantity Fit*, *Price Attractiveness*, *Haversine Proximity*, *Buyer Reliability*).
- **Price Recommendation** — Data-backed crop price recommendation bands based on active market comparable listings.
- **Logistics & Route Optimization** — Capacitated Vehicle Routing Problem (VRP) optimization powered by Google OR-Tools, hub capacity management, multi-vehicle matching, shipment tracking, and landed-cost breakdowns.
- **Role-Based Dashboards** — Separate Lister (Farmer/FPO) and Buyer dashboards with protected routes and JWT auth.
- **Production-Ready UI/UX** — Modern editorial interface, theme design tokens, i18n (English/Hindi/Bengali), and responsive layouts from 320px to 1920px+.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend App** | React 19, TypeScript 5.6, Vite 7, Tailwind CSS v4, Wouter, Lucide Icons |
| **Backend API** | Python 3.12, FastAPI, SQLAlchemy (Async), Uvicorn |
| **Database & Cache** | PostgreSQL (`Numeric(12,2)` money precision), Redis |
| **AI / Optimization** | Scikit-learn, XGBoost, Pandas, Google OR-Tools VRP |
| **Testing & CI** | Pytest (Backend 28/28 passing), TypeScript `tsc` (0 errors), GitHub Actions |
| **Deployment** | Vercel (Frontend SPA), Render (FastAPI + PostgreSQL + Redis) |

---

## 📁 Project Structure

```
ByteFrost/
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── api/                 # API routes (/auth, /listings, /orders, /matching, /logistics, /shipments, /tracking)
│   │   ├── core/                # Config, Database engine, JWT authentication
│   │   ├── models/              # SQLAlchemy ORM models (User, ProduceListing, Order, Route, Shipment)
│   │   ├── schemas/             # Pydantic v2 validation schemas
│   │   ├── services/            # Explainable AI matching, OR-Tools route optimizer, hub & landed-cost services
│   │   └── main.py              # FastAPI entry point & CORS configuration
│   ├── tests/                   # Pytest suite (28 tests passing)
│   ├── alembic/                 # Database migrations
│   ├── seed_demo_data.py        # Hackathon demo seed script (idempotent)
│   └── Dockerfile & requirements.txt
├── frontend/                     # Frontend Web Application (Vite + React)
│   ├── client/src/
│   │   ├── pages/               # Home, Marketplace, MarketMatch, Login, Signup, ListingDetail, Dashboards, Story, Faq, Contact
│   │   ├── components/          # PublicLayout shell, ProtectedRoute, RouteMap, TrackingTimeline
│   │   ├── contexts/            # AuthContext, LanguageContext (i18n)
│   │   ├── lib/api.ts           # Centralized typed Axios client with JWT interceptors
│   │   └── index.css            # Design system tokens, animations & responsive styling
│   ├── server/                  # Node Express preview server
│   ├── e2e/                     # Playwright end-to-end tests
│   ├── package.json & vite.config.ts
│   └── vercel.json              # Vercel SPA build configuration
├── docs/                         # SIH presentation guide, slide content, architecture, production audit
├── .github/workflows/ci.yml      # CI: backend pytest + frontend type-check & build
├── docker-compose.yml            # Local multi-container Docker setup
└── render.yaml                   # Production Render blueprint
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 20+ (pnpm 10 recommended — this repo uses pnpm)
- Python 3.12+
- Docker & Docker Compose *(optional)*

### 2. Run Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env    # set DATABASE_URL, SECRET_KEY, REDIS_URL

# Start backend server
uvicorn app.main:app --reload --port 8000
```
*API Swagger Docs available at:* `http://localhost:8000/docs`

### 3. Run Frontend (KisanSetu React App)
```bash
cd frontend
pnpm install
pnpm dev
```
*Web application available at:* `http://localhost:3000` (Vite proxies `/api` → `localhost:8000`)

### 4. Run Everything via Docker
```bash
cp .env.example .env
docker-compose up -d
```

---

## 🧪 Running Tests & CI Checks

```bash
# Backend (28 tests)
cd backend && source venv/bin/activate && pytest -v

# Frontend type-check + production build
cd frontend && pnpm run type-check && pnpm run build
```

CI (`.github/workflows/ci.yml`) runs all of the above on every push to `main`/`develop` and on PRs to `main`. **A green CI check is required before merging.**

---

## 🌱 Seeding Demo Data (for Hackathon)

Populate the database with demo users, vehicles, hubs, and produce listings:

```bash
cd backend
python3 seed_demo_data.py
```

This creates:
- **Demo Farmer**: phone `+919999999999`, password `demo1234` (Nashik, Maharashtra)
- **Demo Buyer**: phone `+918888888888`, password `demo1234` (Mumbai, Maharashtra)
- **Demo Logistics Partner**: phone `+917777777777`, password `demo1234` (Pune, Maharashtra)
- **Demo FPO**: Nashik Agro Producer Company Ltd
- **Vehicles**: 2 (1 refrigerated truck, 1 standard truck)
- **Hubs**: 2 (Nashik local hub, Mumbai regional hub)
- **Produce Listings**: 3 (Tomato Cherry 500 kg @ ₹45/kg Grade A, Onion Red 300 kg, Potato White 400 kg)

**Complete 6-step demo flow:**
1. Farmer creates 500kg tomato listing
2. AI price recommendation (₹45/kg based on market data)
3. Buyer discovers listing and places order
4. System allocates order with 92% match score
5. Logistics provider assigned with refrigerated vehicle
6. Route optimized: Nashik → Mumbai (165km, 2.5hrs) + shipment tracking

The seed script is **idempotent** — running it again will not create duplicates.

---

## 📡 API Endpoints Summary

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | Backend health check |
| `POST` | `/api/v1/auth/register` | Public | Register farmer/buyer/FPO user |
| `POST` | `/api/v1/auth/login` | Public | Sign in and receive JWT token |
| `GET` | `/api/v1/listings/` | Public | Fetch real-time produce listings |
| `POST` | `/api/v1/listings/` | Bearer Auth | Create new produce listing (Farmer/FPO) |
| `POST` | `/api/v1/matching/find-matches` | Bearer Auth | Find AI buyer matches with explainable score |
| `POST` | `/api/v1/matching/price-recommendation` | Bearer Auth | Get crop price recommendation band |
| `POST` | `/api/v1/logistics/optimize-route` | Bearer Auth | VRP route optimization via OR-Tools |
| `POST` | `/api/v1/logistics/plan-shipment` | Bearer Auth | Shipment planning with hub & vehicle selection |
| `GET` | `/api/v1/shipments/` | Bearer Auth | List shipments |
| `GET` | `/api/v1/tracking/{shipment_id}` | Bearer Auth | Shipment tracking timeline |

Full interactive docs: `http://localhost:8000/docs`

---

## 🤝 Contributing (How to Push)

1. **Always work on a feature branch** — never push directly to `main`:
   ```bash
   git checkout -b feat/your-feature
   ```
2. **Run checks locally before pushing** (backend `pytest`, frontend `pnpm run type-check && pnpm run build`).
3. **Push your branch and open a Pull Request** to `main`:
   ```bash
   git push -u origin feat/your-feature
   ```
4. CI runs automatically on the PR. **Wait for the green check** — a red CI blocks merging.
5. Keep your branch up to date: `git pull --rebase origin main`.

> **Troubleshooting "can't push"**: If you see a red ✗ on your commit, CI failed — click through to the Actions tab and read the failing job log. The most common causes are a stale lockfile (`cd frontend && pnpm install` to regenerate) or a type error (`pnpm run type-check`). You are a collaborator with push access; a red CI check does **not** block the push itself, but it does block merging into `main`.

---

## 👥 Team

| Name | Role | GitHub |
|---|---|---|
| **Subhra Dey** | Backend / Product / DevOps | [@stfusubhra](https://github.com/stfusubhra) |
| **Aradhya Bandyopadhyay** | Research / Data | [@rio4508](https://github.com/rio4508) |
| **Ankit Chakraborty** | Logistics / Routing | [@Ankyytt284](https://github.com/Ankyytt284) |
| **Moupriya Ghosh** | Frontend / UI Design | [@moupriya2803](https://github.com/moupriya2803) |
| **Agni Pratap Pramanik** | AI/ML / Data Pipelines | [@AGNI-911-69](https://github.com/AGNI-911-69) |
| **Rajika Pramanick** | Presentation / Testing | — |

---

## 📜 License

Private Repository — **SIH 2026**