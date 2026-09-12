# KisanSetu — Feature Classification for SIH Demo

**Date:** 12 Sep 2026
**Status:** Demo-ready. Every feature below is reachable in the running app with real backend data — no dead ends, no "coming soon" screens.

Legend: **IMPLEMENTED** = works end-to-end with real backend persistence · **PARTIAL** = core works, some depth missing · **MOCKED** = demo data / external link only, clearly labeled · **NOT IMPLEMENTED** = out of scope for demo.

---

## Buyer Journey (primary demo path)

| Feature | Classification | Evidence |
|---|---|---|
| Auth: register / login / JWT / role enforcement | IMPLEMENTED | `/api/v1/auth/*`; demo login buttons; ProtectedRoute + backend `require_roles` |
| Buyer onboarding (business profile) | IMPLEMENTED | `/buyer/onboarding` (BuyerOnboarding.tsx) |
| Buyer dashboard (recommendations, active/recent orders) | IMPLEMENTED | `/buyer-dashboard`; live from `/listings`, `/orders` |
| Procurement wizard — requirement form | IMPLEMENTED | `/buyer/procurement` step 1 |
| Supply matching (multi-farmer, scored, radius expansion) | IMPLEMENTED | `/matching/match-suppliers`; 1000 kg → 3 farmers with fit % |
| Fulfillment plan (OR-Tools VRP, direct/hub routing, landed cost, consolidation savings) | IMPLEMENTED | `/logistics/fulfill-order`; 3 shipments, ₹40,062 landed, ₹44/kg delivered |
| Order creation with stock reservation | IMPLEMENTED | fulfill-order persists Order + OrderItems + Allocations; atomic listing decrement; returns `order_id` |
| Order lifecycle (confirm → dispatch → ship → in transit) | IMPLEMENTED | `/orders/{id}/confirm|dispatch|ship`; new order ends IN_TRANSIT |
| Order history with status filters | IMPLEMENTED | `/buyer/orders`; new order appears at top |
| Order detail (items, allocations, shipments, route map, tracking timeline) | IMPLEMENTED | `/buyer/orders/:id`; 3 shipments with real distances (51/190/329 km) |
| Insights (spend, volume, on-time rate, supplier match quality, landed cost) | IMPLEMENTED | `/buyer/insights`; live from `/insights/buyer-summary` |
| Notifications (bell, unread count, mark read) | IMPLEMENTED | NotificationsBell + `/notifications/*` |

## Farmer Journey

| Feature | Classification | Evidence |
|---|---|---|
| Farmer dashboard | IMPLEMENTED | `/dashboard` (Dashboard.tsx) |
| Listing CRUD (create, list, delete) | IMPLEMENTED | `/listings` API + CreateListing.tsx |
| Incoming orders | IMPLEMENTED | `/orders/incoming` |
| Shipment tracking (event timeline, status actions) | IMPLEMENTED | `/shipments/*`, `/tracking/*`; TrackingTimeline component |
| Live GPS position feed | PARTIAL | Event-based tracking (PLANNED → … → DELIVERED) with manual status actions; no real-time GPS device feed |

## Platform / Infrastructure

| Feature | Classification | Evidence |
|---|---|---|
| AI/ML scoring embedded as infrastructure (match fit, allocation, price rec, demand forecast) | IMPLEMENTED | `/matching/*`, `/intelligence/*`; no chatbot, no gimmicks |
| Logistics optimization (consolidation, truck assignment, VRP, landed cost) | IMPLEMENTED | consolidation/hub/truck/vrp/landed-cost services; unit-tested |
| Role-based access control | IMPLEMENTED | backend `require_roles` + frontend ProtectedRoute |
| Responsive design (390–1440 px) | IMPLEMENTED | Tailwind responsive classes across buyer pages |
| Accessibility & loading/error/empty states | IMPLEMENTED | skeletons, ErrorBoundary, empty CTAs |
| Backend test suite | IMPLEMENTED | 29 tests passing (incl. fulfill-order persistence + lifecycle) |
| Frontend type-check | IMPLEMENTED | `npx tsc --noEmit` clean |

## Demo Data & External Services

| Feature | Classification | Evidence |
|---|---|---|
| Deterministic demo scenario (FreshMart, 1000 kg tomatoes, 3 farmers) | MOCKED (labeled) | `seed_demo_data.py --reset`; login buttons clearly marked "Demo access" |
| Google Maps route links | MOCKED (labeled) | `build_google_maps_url` generates links; no live map embed |
| Payments | NOT IMPLEMENTED | `payments` table exists in schema only; no API/UI |
| Cold-chain IoT / real-time GPS hardware | NOT IMPLEMENTED | Out of scope; simulated via event timeline |

---

## Demo runbook (verified this session)

1. `cd backend && source venv/bin/activate && python seed_demo_data.py --reset`
2. Start backend: `uvicorn app.main:app --host 127.0.0.1 --port 8000`
3. Start frontend: `npm run dev` (Vite, port 3000)
4. Login → **Demo access → Buyer demo** (FreshMart Retail, Pune)
5. **New procurement** → 1000 kg Tomato, ₹35/kg budget, deadline, Pune → **Match supply** → 3 farmers matched
6. **Build fulfillment plan** → 3 shipments, OR-Tools routes, landed cost → **Confirm & place order**
7. **View order & tracking** → items, allocations, 3 shipment tabs with routes + timeline
8. Order history / dashboard / insights all reflect the new order

Note: placing the demo order consumes the 1,000 kg of live listing stock (correct reservation behavior). Re-run `seed_demo_data.py --reset` before each demo.