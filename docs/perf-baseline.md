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
- `GET /v1/opportunities/matches` — stored `opportunity_alignment` or `{ status: "pending" }`; **no live crawl**
- `GET /v1/progress/snapshot` — readonly intelligence; no `db.commit()`
- `GET /v1/portfolio/recruiter-profile` — readonly + 60s cache
- `GET /v1/trajectory/snapshot` — last persisted snapshot only

Writes happen only on explicit mutations: resume parse, profile update, `POST /v1/intelligence/recompute`, `POST /v1/trajectory/recompute`.

## Running perf checks locally

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest tests/test_perf_baseline.py -v
```

The pytest module asserts warm-path latency budgets using the in-process ASGI client (no network). Results vary by machine; use as a regression guard, not absolute SLA proof.

## Redis (local dev)

Unset `REDIS_URL` in `backend/.env` when Redis is not running. The app uses in-memory cache fallback automatically.

## Frontend dev pages

Phase 9 / research routes require `NEXT_PUBLIC_DEV_MODE=true` or `?dev=true` once (persisted in `localStorage`).
