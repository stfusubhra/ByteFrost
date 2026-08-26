# ByteFrost Architecture

## System Overview

ByteFrost is a microservices-inspired monolith for the MVP phase. The architecture is designed to be modular so services can be extracted later if needed.

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Farmer   │ │ Buyer    │ │ Consumer │ │ Admin    │   │
│  │ Dashboard│ │Dashboard │ │Marketplace│ │Dashboard │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────────┐
│                  API Gateway (FastAPI)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Auth    │ │ Listings │ │  Orders  │ │Matching  │   │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │Logistics │ │Analytics │ │  Admin   │               │
│  │ Service  │ │ Service  │ │ Service  │               │
│  └──────────┘ └──────────┘ └──────────┘               │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   Data Layer                             │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  PostgreSQL  │  │  Redis   │  │  Supabase (Prod) │  │
│  │  (Primary)   │  │ (Cache)  │  │                  │  │
│  └──────────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   ML Services                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Demand   │ │  Price   │ │  Buyer   │               │
│  │Forecast  │ │Prediction│ │ Matching │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│  ┌──────────────────────────────────────┐               │
│  │  Route Optimization (OR-Tools)       │               │
│  └──────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Monolith First
For SIH MVP, we start with a modular monolith. Services are separated by Python modules, not separate deployments. This reduces operational complexity while keeping the door open for extraction.

### 2. Async-First Backend
FastAPI with async SQLAlchemy. This gives us non-blocking I/O for better concurrency when multiple services need database access.

### 3. PostgreSQL as Single Source of Truth
All business data lives in PostgreSQL. Redis is used only for caching and session management, not as a primary store.

### 4. ML as Internal Services
ML models run as Python services within the same FastAPI process for MVP. In production, these would be extracted to separate GPU-enabled services.

### 5. Frontend Consumes APIs Directly
No BFF (Backend for Frontend). The Next.js frontend directly consumes the FastAPI REST endpoints. This simplifies the architecture for the MVP.

## Data Flow

### Farmer Lists Produce
```
Farmer → Frontend → POST /api/v1/listings → PostgreSQL
```

### Buyer Places Order
```
Buyer → Frontend → POST /api/v1/orders → PostgreSQL
                   POST /api/v1/matching/find-matches → ML Service
```

### Logistics Optimization
```
Order Confirmed → POST /api/v1/logistics/optimize-route → OR-Tools → Route Plan
```

### Price Recommendation
```
Farmer → Frontend → POST /api/v1/matching/price-recommendation → ML Service → Price Band
```

## Database Schema (Core Entities)

See `backend/app/models/models.py` for the full schema. Key entities:

- **Users** — All platform users (farmers, buyers, logistics, admin)
- **FPOs** — Farmer Producer Organizations
- **Produce Listings** — Available produce from farmers
- **Orders** — Buyer purchase orders
- **Order Items** — Individual items in an order
- **Allocations** — AI-matched farmer-buyer pairs
- **Shipments** — Logistics assignments with route plans
- **Payments** — Transaction records

## API Design

- RESTful with `/api/v1` prefix
- Consistent request/response envelopes
- JWT-based authentication
- Role-based access control (RBAC)
- Standard error format: `{ "detail": "message" }`

## Security

- Passwords hashed with bcrypt
- JWT tokens with 24-hour expiry
- RBAC: Farmer, FPO Manager, Buyer, Logistics, Admin
- CORS restricted to frontend origin
- Rate limiting on auth endpoints (TODO)
