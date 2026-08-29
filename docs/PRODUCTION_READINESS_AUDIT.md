# ByteFrost Production-Readiness Audit

**Date:** 2026-08-29
**Scope:** Backend (FastAPI), Frontend (Vite/React), Infra (Render + Vercel), CI, ML serving
**Auditor:** OpenWork (code review of the repo at `e8472f4`)

This is an **audit / findings report** — it identifies what needs to change to make the
platform production-ready. It does not apply fixes. Each finding is prioritized and
actionable.

---

## Executive Summary

The application is **functional and demonstrably working** (all 10 backend tests pass,
ML endpoints return real predictions in production, the frontend builds and deploys).
However, it is **not yet production-ready**. The most serious issues are **authorization
gaps** (several endpoints are unauthenticated or lack role checks), **no rate limiting**,
**no structured logging / observability**, and **no automated security scanning**. There
are also several **free-plan infrastructure risks** (single instance, expiring database,
no backups) that are acceptable for a demo but not for production.

**Priority legend:**
- 🔴 **Critical** — security / data-integrity risk; fix before any real users.
- 🟠 **High** — significant risk or operational blocker; fix soon.
- 🟡 **Medium** — best practice / hardening; schedule.
- 🟢 **Low** — cleanup / polish.

---

## 1. Security & Authorization

### 🔴 1.1 Vehicles and Hubs APIs are completely unauthenticated
`backend/app/api/vehicles.py` and `backend/app/api/hubs.py` have **zero** auth
dependencies. Any anonymous caller can:
- `POST /api/v1/vehicles` / `POST /api/v1/hubs` — create fleet/hub records
- `PATCH /api/v1/vehicles/{id}` / `PATCH /api/v1/hubs/{id}` — mutate them
- `GET` all vehicles/hubs

**Fix:** Add `Depends(get_current_user)` and `require_roles(..., {ADMIN, LOGISTICS})`
to every mutating endpoint (and likely the read endpoints too). This is the single
highest-priority finding.

### 🔴 1.2 User listing/profile endpoints lack role checks
`backend/app/api/users.py`:
- `GET /api/v1/users` — any authenticated user can list **all** users (email, name, role).
- `GET /api/v1/users/{id}` — any authenticated user can view any user's profile.

**Fix:** Restrict to `ADMIN` (and maybe `LOGISTICS`). At minimum, `list_users` should be
admin-only.

### 🟠 1.3 No rate limiting on auth or any endpoint
`/auth/register` and `/auth/login` have no rate limiting → brute-force / credential
stuffing / account-creation spam risk. No rate limiting anywhere else either.

**Fix:** Add `slowapi` (or a reverse-proxy rate limit) — at minimum on `/auth/*`.

### 🟠 1.4 No password policy / validation
`UserCreate.password` is a bare `str` with no minimum length or strength check. Weak
passwords are accepted.

**Fix:** Add a `Field(min_length=8, ...)` (or stronger) on the password schema.

### 🟠 1.5 No email verification enforcement
`User.is_verified` exists and defaults to `False`, but nothing enforces it. Any user can
register with any email and immediately use the platform.

**Fix:** Decide whether verification is required; if so, gate access on `is_verified`.

### 🟡 1.6 JWT / token hardening
- `JWT_EXPIRATION_MINUTES` is `1440` (24h) in code, but `render.yaml` overrides it to `30`.
  The 24h default is long for a production token; confirm 30m is intended and make the
  code default match.
- No token revocation / logout / refresh-token flow. A leaked token is valid until expiry.
- `SECRET_KEY` default `"change-me-in-production"` is guarded by `validate_security()`
  (good), and Render sets a generated value (good). Keep this guard.

### 🟡 1.7 CORS
`CORS_ORIGINS` in `render.yaml` is a hard-coded list of two Vercel preview URLs. This is
fine for now but will need to become the real production domain(s) and be managed as
config, not edited in the file each deploy.

### 🟡 1.8 No security headers / HTTPS enforcement at the app layer
No `TrustedHostMiddleware`, no HSTS, no CSP. HTTPS is provided by Render/Vercel at the
edge, but adding `TrustedHostMiddleware` is cheap and prevents host-header attacks.

---

## 2. Data Integrity & Database

### 🟠 2.1 Oversell race condition (TOCTOU)
`create_order` and `allocate_order` check `listing.quantity_kg >= requested` then
decrement — but there is **no row lock** (`SELECT ... FOR UPDATE`) and no atomic
conditional update. Two concurrent orders can both pass the check and oversell a listing.

**Fix:** Use `SELECT ... FOR UPDATE` on the listing row, or an atomic
`UPDATE ... SET quantity_kg = quantity_kg - :q WHERE id = :id AND quantity_kg >= :q`
and check rowcount.

### 🟠 2.2 `get_db` commits on every request
`backend/app/core/database.py` `get_db()` calls `await session.commit()` after every
request, even read-only ones. This is wasteful and can mask bugs (unintended writes
persisted). It also means a read endpoint that mutates an object will silently commit.

**Fix:** Only commit in write paths; make `get_db` a plain session that the endpoint
commits explicitly (or use a `with_transaction` helper).

### 🟡 2.3 No DB connection pooling tuning
`create_async_engine` uses defaults. On Render's free tier (single instance, limited
connections) this is fine, but there is no explicit pool sizing. Add
`pool_size`/`max_overflow` once you scale beyond one instance.

### 🟡 2.4 Migrations run at every container boot
`Dockerfile` CMD runs `alembic upgrade head` on every start. This is convenient but
risky in multi-instance deployments (concurrent migration races) and slows cold starts.
Acceptable for single-instance; note it for scaling.

### 🟡 2.5 No database backups / point-in-time recovery
Render free Postgres has no automated backups. For a demo this is acceptable; for
production, enable backups or a managed DB with PITR.

### 🟢 2.6 No indexes beyond defaults
Only `users.email` and a few FKs are indexed. `produce_listings.crop_name` (used in
`ilike` filters), `orders.buyer_id`, and `order_items.listing_id` are queried frequently
and would benefit from indexes at scale.

---

## 3. Observability, Logging & Error Handling

### 🟠 3.1 No structured logging / request logging
Services use `logging.getLogger` but there is **no request logging middleware**, no
structured (JSON) logging, and no log aggregation. In production you cannot trace a
request or debug failures.

**Fix:** Add a request-logging middleware (method, path, status, duration, user_id) and
ship logs to a service (Render logs, or an external aggregator).

### 🟠 3.2 No error tracking / alerting
No Sentry or equivalent. Unhandled exceptions are invisible until a user reports them.

**Fix:** Add Sentry (or similar) for backend and frontend.

### 🟡 3.3 Health check is shallow
`/health` returns `{"status": "ok"}` without checking the DB. A DB outage would still
report healthy. The earlier deploy failure (`d64e0ec`, "Timed out after waiting for
internal health check") shows health-check flakiness matters.

**Fix:** Make `/health` (or a separate `/health/ready`) check DB connectivity.

### 🟡 3.4 No graceful shutdown / worker count tuning
Uvicorn runs with default single worker. Fine for free tier; document that scaling needs
`--workers N` and a process manager.

---

## 4. ML Serving

### 🟡 4.1 ML inference runs synchronously in the request path
`recommend_price` / `forecast_demand` / `find-matches` load and run XGBoost models
inline. Model load happens per-call (or is cached?) — check `serve.py`. For low traffic
this is fine, but it blocks the event loop and will not scale.

**Fix:** Load models once at startup (lazy singleton), and consider moving heavy
inference to a background worker / Celery (Celery is already a dependency).

### 🟡 4.2 Hard-coded ML feature seeds
`recommend_price` hard-codes `mandi="Azadpur, Delhi"`, `month=8`, `week_of_year=35`,
`day_of_year=240`, and synthetic lag features. These are placeholders, not real market
data. The model output is therefore only as good as these seeds.

**Fix:** Feed real listing/order data into the features, or clearly label the output as
an estimate.

### 🟢 4.3 Model artifacts committed to git
`backend/ml/models/*.joblib` are force-committed (gitignored but added). This works but
bloats the repo and couples model versioning to app deploys. Consider a model registry /
artifact store for production.

---

## 5. Frontend

### 🟡 5.1 Leftover/dead files committed to the repo root
`temp.css` (126 KB), `temp_older.css` (124 KB), `temp_dev.css` (0 B), `old_globals.css`,
`SUMMARY.md`, `FINAL_STATUS.md`, `backend_server.log` (gitignored, good) are tracked or
present. These are build/debug leftovers and should be removed from the repo.

### 🟡 5.2 Frontend has no automated unit tests
`package.json` has `vitest` as a devDependency but no `test` script and no unit tests.
Only Playwright e2e config exists. Add at least a smoke test for the API client and key
pages.

### 🟢 5.3 `vercel.json` rewrites all `/api/*` to Render
This is a clean same-origin proxy setup (good). Just confirm the rewrite target is the
production backend and that CORS stays aligned.

---

## 6. CI / Testing

### 🟠 6.1 CI does not run the ML tests / model path
The CI backend job runs `pytest` but the ML path (`ML_AVAILABLE`) and the model-in-Docker
path (the exact bug fixed in `e8472f4`) are not covered by CI. A regression could ship
again.

**Fix:** Add a CI step that builds the Docker image and asserts the model files are
present at `/app/ml/models/` and that `recommend_price` returns a real value.

### 🟡 6.2 No security scanning in CI
No dependency vulnerability scan (e.g., `pip-audit`, `npm audit`), no secret scanning
(e.g., `gitleaks`), no SAST. Add at least `pip-audit` + `npm audit` to CI.

### 🟡 6.3 Test coverage is thin
10 tests cover auth, listings, orders, and matching. No tests for logistics
(vehicles/hubs/fulfillment/VRP), users, or the ML fallback paths.

### 🟢 6.4 `ci.yml.bak` committed
`.github/workflows/ci.yml.bak` is a leftover backup file in the repo. Remove it.

---

## 7. Infrastructure (Render / Vercel)

### 🟠 7.1 Single free instance — no redundancy
Render free web service is a single instance that **sleeps** when idle. Cold starts are
slow and there is no failover. Fine for a demo; not production.

### 🟠 7.2 Free Postgres expires
`bytefrost-db` (free) **expires 2026-09-27** unless upgraded. Plan the upgrade or a
migration before then.

### 🟡 7.3 Secrets management
`SECRET_KEY` is generated by Render (good). `GOOGLE_MAPS_API_KEY`, Supabase keys, and DB
credentials are env vars. Confirm none are committed (`.env*` is gitignored — verified
clean). Keep secrets out of the repo and rotate them.

### 🟡 7.4 No staging environment
Only production is deployed. Add a staging deploy (Render + Vercel preview) so changes
are validated before hitting prod.

---

## 8. Code Quality / Maintainability

### 🟡 8.1 `__import__` hack in `auth.py`
`backend/app/api/auth.py` line 55-57 uses `__import__("app.core.security", ...)` to get
`get_current_user`. This is fragile and unreadable. Import it normally at the top.

### 🟡 8.2 Duplicated haversine / distance logic
`_haversine_km` is duplicated in `matching.py` and `logistics.py`, and `maps_service.py`
has its own `haversine`. Consolidate into one shared util.

### 🟢 8.3 `extra = "ignore"` in Settings
Silently ignores unknown env vars, which can hide typos in config. Consider
`extra = "forbid"` in production.

### 🟢 8.4 Version is hard-coded in multiple places
`0.1.0` appears in `config.py`, `main.py`, and `/health`. Centralize it.

---

## Prioritized Action Plan

### Do first (Critical — security)
1. **Add auth + role checks to `vehicles.py` and `hubs.py`** (🔴 1.1)
2. **Restrict `users.py` list/get to admin** (🔴 1.2)
3. **Add rate limiting to `/auth/*`** (🟠 1.3)
4. **Fix the oversell race with row locks / atomic update** (🟠 2.1)

### Do next (High)
5. **Add request logging + Sentry** (🟠 3.1, 3.2)
6. **Make `/health` check the DB** (🟡 3.3)
7. **Add password policy** (🟠 1.4)
8. **Add CI coverage for the ML/Docker path + security scans** (🟠 6.1, 6.2)
9. **Fix `get_db` commit-on-read** (🟠 2.2)
10. **Plan the free-tier DB expiry + single-instance limits** (🟠 7.1, 7.2)

### Then (Medium / cleanup)
11. Remove leftover files (`temp*.css`, `old_globals.css`, `SUMMARY.md`, `FINAL_STATUS.md`, `ci.yml.bak`) (🟡 5.1, 🟢 6.4)
12. Fix `__import__` hack + dedupe haversine (🟡 8.1, 8.2)
13. Add frontend unit tests (🟡 5.2)
14. Add staging environment (🟡 7.4)
15. Add DB indexes (🟢 2.6)

---

## What's Already Good (keep it)

- ✅ `SECRET_KEY` production guard (`validate_security`) + Render-generated secret.
- ✅ Server-side price computation (client price is ignored) — tested.
- ✅ Oversell prevention at the API level (needs the race fix, but the check exists).
- ✅ Role enforcement on listings and orders (farmer can't order, buyer can't list) — tested.
- ✅ ML models now ship in the Docker image (the `e8472f4` fix) and return real predictions.
- ✅ Same-origin `/api` proxy via Vercel rewrites — clean, no CORS sprawl.
- ✅ `.env*` and logs are gitignored — no committed secrets found.
- ✅ Alembic migrations are versioned and run in CI.
- ✅ Deterministic, honest fallbacks in the ML endpoints (no fabricated data).
