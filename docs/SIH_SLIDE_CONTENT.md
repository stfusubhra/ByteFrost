# KisanSetu / ByteFrost — Slide-by-Slide Content (Copy-Paste Ready)

> **SIH 2026 · Problem Statement 26033 · Team ByteFrost**
> Use this with the diagrams in `docs/sih_assets/` (01–06) and the strategy guide in `docs/SIH_PRESENTATION_GUIDE.md`.

---

## SLIDE 1 — Title & Team

**Title (big):** KisanSetu
**Subtitle:** AI-Powered Direct Farm-to-Market Supply Chain Platform
**Tagline:** From Farm to Market, Connected.
**Problem Statement:** PS 26033

**Team (6 members):**
| Name | Role |
|---|---|
| Subhra Dey | Backend / Product / DevOps |
| Aradhya Bandyopadhyay | Research / Data |
| Ankit Chakraborty | Logistics / Routing |
| Moupriya Ghosh | Frontend / UI Design |
| Agni Pratap Pramanik | AI/ML / Data Pipelines |
| Rajika Pramanick | Presentation / Testing |

**Visual:** Logo + team photo + one-line value prop.
**Hook (say this):** "Every ₹100 a consumer pays for vegetables, the farmer gets less than ₹35. We built KisanSetu to fix that."

---

## SLIDE 2 — The Problem

**Headline:** India's farm-to-market supply chain is broken.

**Bullets:**
- **4 layers of intermediaries** — Farmer → Aggregator → Wholesaler → Retailer → Consumer
- **Margin stacking** — each layer takes a cut; farmer gets a fraction of the final price
- **Price opacity** — farmers don't know the true market price → sell at a loss
- **Post-harvest loss** — ~15–20% of produce lost in transit
- **Routing inefficiency** — empty return trips, wasted fuel, delays
- **No direct market access** — small farmers can't reach bulk buyers

**Visual:** `03_problem_solution.png` (left side = traditional chain, right side = KisanSetu)

---

## SLIDE 3 — Why Now / Market Opportunity

**Headline:** The time is right for agri-tech.

**Bullets:**
- India = world's **2nd-largest agricultural producer**
- **~86% of farmers** are small/marginal with limited market access
- **Digital adoption surging** in rural India (smartphones, UPI, internet)
- **Government push** — Digital Agriculture Mission, e-NAM, APMC modernization
- **Market size:** Indian agri-tech market projected to grow multi-fold by 2030

**Visual:** Simple stat callouts (big numbers).

---

## SLIDE 4 — Our Solution (Overview)

**Headline:** KisanSetu connects farmers & FPOs directly to bulk buyers.

**One-liner:** A direct farm-to-market platform with AI-powered matching, fair pricing, and optimized logistics.

**4 Core Modules (grid):**
1. **Direct Marketplace** — Real-time produce listings, quality grades, verified locations
2. **Explainable AI Matching** — Transparent multi-factor buyer-seller scoring
3. **Price Recommendation** — Data-backed price bands from live market comparables
4. **Logistics & Route Optimization** — VRP optimization via Google OR-Tools

**Visual:** 4-box grid, one per module.

---

## SLIDE 5 — How It Works (User Flow)

**Headline:** From listing to delivery in 7 steps.

**Flow (numbered):**
1. Farmer creates produce listing (500kg tomatoes)
2. AI recommends fair price (₹45/kg)
3. Buyer discovers listing on marketplace
4. System matches buyer — 92% score
5. Logistics assigned (refrigerated truck)
6. Route optimized: Nashik → Mumbai (165km, 2.5hr)
7. Shipment created with tracking readiness

**Visual:** `02_user_flow.png`

---

## SLIDE 6 — System Architecture

**Headline:** Clean, modular, production-ready.

**Layers (top to bottom):**
1. **Frontend** — React 19 + TypeScript + Vite (Vercel)
2. **Backend** — FastAPI + SQLAlchemy Async (Render)
   - Auth (JWT), Listings, Orders, Matching, Price Rec, Logistics, Fulfillment
3. **Data Layer** — PostgreSQL (money precision) + Redis (cache) + ML models
4. **AI/Optimization** — XGBoost (price + demand) + OR-Tools VRP
5. **Deployment** — Vercel + Render + Docker

**Visual:** `01_architecture.png`

---

## SLIDE 7 — Technology Stack

**Headline:** Built on a proven, modern stack.

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind v4 | Fast, typed, modern |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy Async | High-performance async API |
| **Database** | PostgreSQL, Redis | Reliable + fast caching |
| **AI/ML** | XGBoost, Scikit-learn, Pandas | Explainable, tabular-friendly |
| **Optimization** | Google OR-Tools VRP | Industry-standard routing |
| **Testing** | Pytest (10/10), tsc (0 errors) | Quality assured |
| **Deployment** | Vercel, Render, Docker | Production live |

**Tip:** Emphasize *why* each choice — especially XGBoost (explainable) and OR-Tools (proven).

---

## SLIDE 8 — Innovation & Uniqueness

**Headline:** What makes KisanSetu different?

**Bullets:**
1. **Explainable AI Matching** — not a black box; every match shows *why* (quantity, price, proximity, reliability)
2. **Data-backed Price Recommendation** — from live market comparables, not guesswork
3. **Real VRP Logistics Optimization** — time windows + capacity constraints (OR-Tools)
4. **Landed Cost Calculation** — full breakdown (produce + transport + handling + spoilage)
5. **FPO-to-Buyer Aggregation** — supports Farmer Producer Organizations

**Visual:** `04_explainable_ai.png` (show the transparent scoring breakdown)

---

## SLIDE 9 — LIVE DEMO (Your Winning Moment)

**Headline:** See it working live.

**Demo script (90 seconds):**
1. Log in as demo farmer → show dashboard
2. Show tomato listing (500kg @ ₹45/kg)
3. Show AI price recommendation
4. Switch to buyer → discover listing
5. Place order → show 92% match score with breakdown
6. Show logistics assignment (refrigerated vehicle)
7. Show optimized route (Nashik → Mumbai)

**Backup:** Have screenshots/video ready in case live demo fails.

---

## SLIDE 10 — Implementation & Feasibility

**Headline:** Fully built, tested, and deployed.

**What's done:**
- ✅ Functional FastAPI backend (PostgreSQL + Redis)
- ✅ Functional React frontend (Vite)
- ✅ Trained ML models (XGBoost price + demand)
- ✅ VRP route optimization working (OR-Tools)
- ✅ 10/10 backend tests passing, 0 TypeScript errors
- ✅ Deployed live (Vercel + Render)
- ✅ Dockerized for easy deployment

**Feasibility:**
- **Technical:** All components proven & working
- **Data:** Synthetic now; designed for real mandi data (e-NAM/APMC)
- **Cost:** Low (free-tier cloud + open-source)
- **Timeline:** Built in a hackathon sprint — proven execution

---

## SLIDE 11 — Business Model & Viability

**Headline:** A real, sustainable business — not just a demo.

**Revenue streams:**
1. **Transaction commission** — 1–2% per order
2. **Logistics fees** — margin on optimized transport
3. **Premium/FPO subscriptions** — analytics, priority matching
4. **Data insights as a service** — anonymized market intelligence

**Unit economics:** Example consolidated order ₹46,400 → 1% commission = ₹464/order

**Cost structure:** Low cloud cost, open-source stack, scales with users

**Viability:** Platform model scales with users; partnerships with e-NAM, APMC, FPOs, logistics

**Visual:** `05_business_model.png`

---

## SLIDE 12 — Impact & Benefits

**Headline:** Real impact across the value chain.

**For farmers:** Higher earnings, fair price, less post-harvest loss
**For buyers:** Lower prices, fresher produce, transparent sourcing
**For ecosystem:** Less food waste, lower carbon footprint, efficient markets

**Demo metric:** 1,520kg consolidated from 3 farms → 1 optimized shipment → ₹46,400 value

**Visual:** `06_impact.png`

---

## SLIDE 13 — Scalability & Future Scope

**Headline:** A clear roadmap to scale.

**Near-term:**
- Real mandi data integration (e-NAM/APMC)
- Mobile app
- Multi-language (already EN/HI/BN)

**Mid-term:**
- Cold-chain tracking
- IoT sensors for freshness
- Predictive demand at scale

**Long-term:**
- Pan-India expansion
- Government scheme integration
- Carbon credits for optimized logistics

---

## SLIDE 14 — Conclusion / Ask

**Recap:** KisanSetu connects farmers directly to markets with AI-powered matching, fair pricing, and optimized logistics.

**The ask:** "We're building the future of Indian agriculture — support us to scale this across India."

**Thank the judges.**

---

## 🎤 Speaker Script (Concise, ~5–7 min)

> **Slide 1 (30s):** "Good morning judges. Every ₹100 a consumer pays for vegetables, the farmer gets less than ₹35. We're Team ByteFrost, and we built KisanSetu to fix that."
>
> **Slide 2 (45s):** "India's supply chain has 4 layers of intermediaries. Each takes a cut, so farmers lose margin, prices stay opaque, and 15–20% of produce is lost in transit."
>
> **Slide 3 (30s):** "But the time is right — 86% of farmers are small, digital adoption is surging, and the government is pushing agri-tech."
>
> **Slide 4 (45s):** "Our solution: a direct farm-to-market platform with 4 pillars — a marketplace, explainable AI matching, price recommendation, and optimized logistics."
>
> **Slide 5 (45s):** "Here's the flow — a farmer lists produce, AI prices it fairly, a buyer discovers it, the system matches them with a transparent 92% score, assigns a refrigerated truck, and optimizes the route."
>
> **Slide 6 (45s):** "Architecturally, we have a clean React frontend, a FastAPI backend, PostgreSQL + Redis, and an AI engine with XGBoost and OR-Tools — all deployed live."
>
> **Slide 7 (30s):** "We chose XGBoost because it's explainable, and OR-Tools because it's the industry standard for routing."
>
> **Slide 8 (45s):** "Our key innovation is explainable AI — every match shows exactly why, with a transparent score breakdown. No black boxes."
>
> **Slide 9 (90s):** [LIVE DEMO — walk through the 7-step flow]
>
> **Slide 10 (45s):** "This isn't a mockup — it's fully built, tested (10/10 passing), and deployed. It's feasible and ready to scale."
>
> **Slide 11 (45s):** "And it's a real business — commission, logistics fees, subscriptions, and data insights. A ₹46,400 order yields ₹464 at just 1%."
>
> **Slide 12 (30s):** "The impact: farmers earn more, buyers pay less, and the ecosystem wastes less."
>
> **Slide 13 (30s):** "Our roadmap: real mandi data, mobile app, cold-chain tracking, and pan-India expansion."
>
> **Slide 14 (30s):** "KisanSetu connects farmers directly to markets. We're building the future of Indian agriculture — support us to scale it. Thank you."

---

## 🖼️ Diagram Files (in `docs/sih_assets/`)

| File | Use On |
|---|---|
| `01_architecture.png` | Slide 6 |
| `02_user_flow.png` | Slide 5 |
| `03_problem_solution.png` | Slide 2 |
| `04_explainable_ai.png` | Slide 8 |
| `05_business_model.png` | Slide 11 |
| `06_impact.png` | Slide 12 |

---

## ✅ Final Checklist

- [ ] All 14 slides built, one idea each
- [ ] Diagrams inserted (01–06)
- [ ] Problem slide has data/visual
- [ ] Live demo rehearsed 10+ times with backup
- [ ] Business model slide has revenue + unit economics
- [ ] Speaker script practiced to 5–7 min
- [ ] Q&A answers prepared (see guide)
