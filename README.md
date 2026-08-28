# ByteFrost / KisanSetu

> AI-Powered Direct Farm-to-Market Supply Chain Platform  
> **SIH 2026 — Problem Statement 26033**

[![Repository](https://img.shields.io/badge/GitHub-stfusubhra%2FByteFrost-181717?logo=github)](https://github.com/stfusubhra/ByteFrost)
[![Live Web Application](https://img.shields.io/badge/Vercel-KisanSetu%20App-000000?logo=vercel)](https://kisansetu-7yx46ynxd-la-masia1.vercel.app/)
[![Backend API Status](https://img.shields.io/badge/Render-FastAPI%20Backend-46E3B7?logo=render)](https://bytefrost-backend.onrender.com/health)

---

## 🌾 Problem Statement

Multiple intermediaries reduce farmers' earnings while increasing end-consumer prices. The traditional 4-layer agricultural supply chain (**Farmer → Aggregator → Wholesaler → Retailer → Consumer**) creates margin stacking, price opacity, high post-harvest loss, and routing inefficiencies.

## 🚀 Solution

**ByteFrost / KisanSetu** is a direct farm-to-market platform connecting farmers and Farmer Producer Organizations (FPOs) directly with bulk buyers and consumers.

- **Direct Marketplace** — Public produce discovery with real-time listings, quality grade badges, and verified seller locations.
- **Explainable AI Matching** — Multi-factor buyer-seller matching with transparent scoring breakdown (*Quantity Fit*, *Price Attractiveness*, *Haversine Proximity*, *Buyer Reliability*).
- **Price Recommendation** — Data-backed crop price recommendation bands based on active market comparable listings.
- **Logistics & Route Optimization** — Capacitated Vehicle Routing Problem (VRP) optimization powered by Google OR-Tools.
- **Production-Ready UI/UX** — Modern editorial glassmorphism interface, theme design tokens, interactive role toggles, and seamless scroll micro-interactions.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend App** | React 19, TypeScript 5.6, Vite, Tailwind CSS v4, Wouter, Lucide Icons |
| **Backend API** | Python 3.11+, FastAPI, SQLAlchemy (Async), Uvicorn |
| **Database & Cache** | PostgreSQL (`Numeric(12,2)` money precision), Redis |
| **AI / Optimization** | Scikit-learn, XGBoost, Pandas, Google OR-Tools VRP |
| **Testing & CI** | Pytest (Backend 10/10 passing), TypeScript `tsc` (0 errors) |
| **Deployment** | Vercel (Frontend SPA Static Export), Render (FastAPI + PostgreSQL + Redis) |

---

## 📁 Project Structure

```
ByteFrost/
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── api/                 # API routes (/auth, /listings, /orders, /matching, /logistics, /tracking)
│   │   ├── core/                # Config, Database engine, JWT authentication
│   │   ├── models/              # SQLAlchemy ORM models (User, ProduceListing, Order, Route, Shipment)
│   │   ├── schemas/             # Pydantic v2 validation schemas
│   │   ├── services/            # Explainable AI matching, OR-Tools route optimizer
│   │   └── main.py              # FastAPI entry point & CORS configuration
│   ├── tests/                   # Pytest test suite (10/10 tests passing)
│   ├── alembic/                 # Database migrations
│   └── Dockerfile & requirements.txt
├── kisansetu/                    # Primary Frontend Web Application
│   ├── client/src/
│   │   ├── pages/               # Home, Marketplace, MarketMatch, Login, Signup, Story, Faq, Contact
│   │   ├── components/          # PublicLayout shell, glassmorphic UI components
│   │   ├── lib/api.ts           # Centralized typed Axios client with JWT interceptors
│   │   └── index.css            # Custom design system tokens, animations & responsive styling
│   ├── server/                  # Node Express preview server
│   ├── package.json & vite.config.ts
│   └── vercel.json              # Vercel SPA build configuration
├── frontend/                     # Secondary Vercel build target & fallback proxy
├── vercel.json & package.json    # Root multi-target Vercel configuration
├── docker-compose.yml            # Local multi-container Docker setup
└── render.yaml                   # Production Render blueprint
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose *(optional)*

### 2. Run Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```
*API Swagger Docs available at:* `http://localhost:8000/docs`

### 3. Run Frontend (KisanSetu React App)
```bash
cd kisansetu
pnpm install               # or npm install
pnpm dev                   # or npm run dev
```
*Web application available at:* `http://localhost:3000`

### 4. Run Everything via Docker
```bash
cp .env.example .env
docker-compose up -d
```

---

## 📡 API Endpoints Summary

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | Backend health check |
| `POST` | `/api/v1/auth/register` | Public | Register new farmer/buyer/FPO user |
| `POST` | `/api/v1/auth/login` | Public | Sign in and receive JWT token |
| `GET` | `/api/v1/listings/` | Public | Fetch real-time produce listings |
| `POST` | `/api/v1/listings/` | Bearer Auth | Create new produce listing (Farmer/FPO) |
| `POST` | `/api/v1/matching/find-matches` | Bearer Auth | Find AI buyer matches with explainable score |
| `POST` | `/api/v1/matching/price-recommendation` | Bearer Auth | Get crop price recommendation band |
| `POST` | `/api/v1/logistics/optimize-route` | Bearer Auth | VRP Route optimization via OR-Tools |

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
