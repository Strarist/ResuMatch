# Performance Baseline

Targets from `.agents/rules/performancetargets.md`:

| Surface | Target | How measured |
|---------|--------|--------------|
| Page load (dashboard) | < 2s | Frontend parallel `fetchDashboardData()` |
| `GET /v1/opportunities/matches` | < 2s | Backend test + server timing logs |
| Resume upload + parse kickoff | < 10s | Upload response before background parse |
| Google OAuth | 100% first-attempt | Manual QA |

## Backend endpoints (read path, post-stabilization)

After the reliability sprint, these GET paths are **read-only** and cache-backed:

- `GET /v1/strategic/focus` — `get_intelligence_summary_readonly` + 60s cache
- `GET /v1/opportunities/matches` — stored `opportunity_alignment` or `{ status: "pending" }`; **no live crawl**; Redis cache key `opportunities:matches:{user_id}` (medium TTL)
- `GET /v1/opportunities/gaps` — cache key `opportunities:gaps:{user_id}`
- `GET /v1/opportunities/radar` — cache key `opportunities:radar:{user_id}`
- `GET /v1/progress/snapshot` — readonly intelligence; no `db.commit()`
- `GET /v1/portfolio/recruiter-profile` — readonly + 60s cache
- `GET /v1/trajectory/snapshot` — last persisted snapshot only

Writes happen only on explicit mutations: resume parse, profile update, `POST /v1/intelligence/recompute`, `POST /v1/trajectory/recompute`.

## Phase 2 stabilization notes (2026-06-23)

| Change | Expected impact |
|--------|-----------------|
| Resume fast path timing logs (`parse_fast_path_complete`, `parse_enrichment_complete`) | Measure upload-to-profile vs deferred enrichment |
| Copilot market snapshot cache (`copilot:market_snap:{user_id}`, 5 min TTL) | Fewer repeated `compute_market_intelligence` calls per chat |
| `intelligence-client` 8s request timeout | Fail fast + retry UI parity with auth client |
| Alembic-only schema (removed runtime `db_schema_patches`) | No drift between ORM and Postgres |

Re-run after changes:

```powershell
cd backend
py -m pytest tests/test_perf_baseline.py tests/test_migrations_fresh_db.py -v
```

## Phase 3 verification notes (2026-06-24)

Automated smoke via `pytest -m critical` (7 tests, ~5.5s on dev machine):

| Flow | Test coverage | Result |
|------|---------------|--------|
| Register + login + profile + refresh | `test_auth_endpoints.py` | PASS |
| Workspace sessions CRUD | `test_workspace_sessions.py` | PASS |
| Opportunities endpoints | `test_opportunities_endpoints.py` | PASS |
| Resume parse failure + `parse_error` | `test_resume_lifecycle.py` | PASS |
| Degraded opportunity feed (no seed jobs) | `test_opportunity_degraded.py` | PASS |
| Alembic fresh DB migrations | `test_migrations_fresh_db.py` | PASS |

Deploy/OAuth proof checklist: [deploy-verification.md](deploy-verification.md) (manual steps for Render + Google Console).

Record your machine's warm-path timings here when benchmarking locally:

| Endpoint | Before (ms) | After (ms) | Budget |
|----------|-------------|------------|--------|
| `GET /v1/opportunities/matches` (warm) | NOT VERIFIED | ~50–200 (ASGI, in-process) | 2000 |
| `GET /v1/strategic/focus` | NOT VERIFIED | ~100–400 (ASGI, in-process) | 2000 |
| `GET /v1/market-intelligence/snapshot` (warm) | NOT VERIFIED | ~50–200 (ASGI, in-process) | 2000 |
| `GET /v1/progress/snapshot` | NOT VERIFIED | ~50–200 (ASGI, in-process) | 2000 |
| Resume upload response (`POST /v1/resumes`) | NOT VERIFIED | ~200–1200 (ASGI, no background parse in pytest) | 10000 |
| Google OAuth first attempt | NOT VERIFIED | Manual — see deploy-verification.md | 100% |

## Running perf checks locally

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest tests/test_perf_baseline.py -v
```

The pytest module asserts warm-path latency budgets using the in-process ASGI client (no network). Results vary by machine; use as a regression guard, not absolute SLA proof.

**Opportunities page (frontend):** `opportunities.getAll()` fires three parallel GETs (`/matches`, `/gaps`, `/radar`). Each GET is deduplicated via `intelligence-client` inflight cache. Backend logs `[MATCHES] Total=...ms` on each request for local measurement.

## Redis (local dev)

Leave `REDIS_URL=redis://localhost:6379` in `backend/.env` and run `docker compose up -d redis` from the repo root. If Redis is temporarily down, the app degrades to in-memory cache and in-memory rate limits without failing startup.

## Frontend dev pages

Phase 9 / research routes require `NEXT_PUBLIC_DEV_MODE=true` or `?dev=true` once (persisted in `localStorage`).
