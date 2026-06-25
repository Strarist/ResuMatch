# Skillyn Phase Gap Backlog

**Generated:** 2026-06-22
**Source:** Evidence-based phase audit (`docs/phase_audit_report.md`, `docs/phase_matrix.json`)
**Ordering:** P0 = blocks release trust → P3 = polish after core is trustworthy

---

## P0 — Release trust blockers

These items make the project **look more complete than it is**. Fix before claiming production readiness.

| ID | Gap | Type | Phase | Evidence | Recommended action |
|----|-----|------|-------|----------|-------------------|
| G-001 | **pytest not in CI** | Fake completion | 9.3 | `.github/workflows/ci.yml` — AST lint + import only | Add `pytest -q` job with `ENV=testing`, SQLite test DB |
| G-002 | **Alembic missing SSOT tables** | Unstable / misleading | 1.2, 10.2 | `main.py` `create_all`; migrations only `users/resumes/jobs/matches` | Migrate `StrategicProfile`, roadmap, workspace, user_progress, memory tables |
| G-003 | **`create_all` as production schema authority** | Infra drift | 1.2, 11.2 | `backend/app/main.py:65` | Use Alembic in prod lifespan; restrict `create_all` to `ENV=testing` |
| G-004 | **Frontend `tsc \|\| true`** | Fake quality gate | 9.3 | `.github/workflows/ci.yml:48` | Fail CI on type errors |
| G-005 | **Silent API failure on core pages** | Reliability | 3.5, 5.3, 11.1 | `opportunities/page.tsx`, `market-intelligence/page.tsx` empty catch | Surface error states + retry using design tokens |
| G-006 | **Deploy env mismatch** | Runtime risk | 10.1, 10.3 | `render.yaml` vs `config.py` (`OPENROUTER_API_KEY`, `REDIS_URL`) | Align Render blueprint with `backend/.env.example` |

---

## P1 — Core correctness & realism

| ID | Gap | Type | Phase | Evidence | Recommended action |
|----|-----|------|-------|----------|-------------------|
| G-007 | **Demo job fallback when crawlers fail** | Fake completion | 3.1, 11.4 | `ingestion.py` `FALLBACK_JOBS` | Show explicit empty state; don't present seed jobs as LIVE |
| G-008 | **Generic roadmap milestone filler** | Unrealistic output | 4.1, 4.4, 11.4 | `strategic.py` hardcoded gaps; `generators/__init__.py` fallback | Derive gaps from resume/trajectory only; reduce template milestones |
| G-009 | **Static market intelligence heuristics** | Partial implementation | 5.1, 5.4 | `market_intelligence/engine.py` | Label outputs as heuristic; or integrate one real signal source |
| G-010 | **No frontend token refresh** | Auth reliability | 1.3, 8.2 | `auth/api.ts` has `refreshToken`; unused | Wire refresh or remove dead API; align with `AUTH_README.md` |
| G-011 | **No OAuth E2E test** | Missing coverage | 1.3, 9.1 | `test_auth_endpoints.py` only password flow | Mock OAuth callback integration test |
| G-012 | **Dual API clients** | Architectural debt | 3.5, 8.1 | `intelligence-client.ts` + `auth/api.ts` | Unify timeout, offline, error normalization |
| G-013 | **Unused Job/Match ORM** | Misleading domain | 0.3, 3.1 | `app/models/opportunity.py` vs JSON on `StrategicProfile` | Document deprecation or wire/remove legacy tables |
| G-014 | **Years/experience on old profiles** | Data correctness | 5.2, 11.1 | `trajectory_state` without `years_of_experience` until sync | One-time backfill migration or sync prompt on profile load |

---

## P2 — Hardening & orchestration clarity

| ID | Gap | Type | Phase | Evidence | Recommended action |
|----|-----|------|-------|----------|-------------------|
| G-015 | **Phase 7 schema-rich, runtime-light** | Overstated capability | 7.x | Many models; sandbox routers gated in prod | Document production orchestration boundary; don't count sandbox APIs toward completion |
| G-016 | **Dual event buses** | Unstable architecture | 7.2 | `agents/shared/event_bus.py` + `propagation/event_bus.py` | Consolidate or document single production bus |
| G-017 | **Workspace copilot thin tests** | Missing coverage | 6.2, 9.1 | `test_read_semantics.py` only | Add session/message/copilot integration tests |
| G-018 | **Roadmap mutation tests thin** | Missing coverage | 4.2, 9.1 | No tests for create/mutate/complete node | Add `roadmap_intel` mutation suite |
| G-019 | **Perf baselines not in CI** | Unmeasured | 9.2, 11.3 | `test_perf_baseline.py` local only | Run perf subset in CI with generous thresholds or nightly job |
| G-020 | **Sentry/Prometheus not pinned** | Observability gap | 9.2, 10.1 | Optional imports in `main.py` | Add to `requirements.txt` or remove hooks |
| G-021 | **Three Docker production paths** | Deploy fragmentation | 10.1 | Root `Dockerfile`, `backend/Dockerfile.prod`, CI | Single canonical prod image |
| G-022 | **Legacy routes still mounted** | Surface area | 0.2, 1.1 | `/v1/analyze`, `/v1/roadmap/stream` | Return 410 or remove from prod router |
| G-023 | **Redis per-process rate limit fallback** | Multi-worker risk | 1.5, 11.2 | `security.py` in-memory fallback | Document limitation; require Redis in prod |

---

## P3 — UX cohesion & product polish

| ID | Gap | Type | Phase | Evidence | Recommended action |
|----|-----|------|-------|----------|-------------------|
| G-024 | **Light mode incomplete** | UX polish | 8.1, 11.4 | Auth/loading/error hardcoded dark | Finish token migration; QA all CORE pages |
| G-025 | **Persona/lifecycle selector missing** | Documented but missing | 8.2, 6.3 | `USER_FLOW_ARCHITECTURE.md` vs `AppShell.tsx` | Add shell control or update docs |
| G-026 | **Workspace loading/empty weak** | UX polish | 6.3, 8.3 | `workspace/page.tsx` | Page skeleton + dedicated empty state |
| G-027 | **Settings prefs localStorage-only** | Partial | 8.2 | `settings/page.tsx` | Persist preferences to backend or document local-only |
| G-028 | **Market page hierarchy dense** | UX polish | 8.4, 5.3 | `market-intelligence/page.tsx` | Clarity pass per roadmap/opportunities pattern |
| G-029 | **Skillyn/ResuMatch naming drift** | Doc/deploy coherence | 0.4, 10.2 | `docker-compose.yml`, `render.yaml`, frontend docs | Normalize naming in infra and docs |
| G-030 | **Zero frontend tests** | Missing coverage | 9.1 | Jest in package.json, no test files | Add smoke tests for auth guard + intelligence-client |
| G-031 | **Simulation mode entry hidden** | UX discoverability | 6.3, 11.4 | Only `EmptyState` triggers simulation | Expose in settings or document as dev-only |

---

## Fake completion assumptions (explicit callouts)

| Assumption | Reality | Backlog IDs |
|------------|---------|-------------|
| "We have tests" | 29 files exist; CI never runs them | G-001, G-004 |
| "DB is migrated" | Alembic covers ~4 legacy tables; rest via `create_all` | G-002, G-003 |
| "Opportunities are live" | RemoteOK/Arbeitnow + quality pipeline, but `FALLBACK_JOBS` on failure | G-007 |
| "Orchestration runtime exists" | Tables + sandbox APIs; prod excludes Phase 9 routers | G-015 |
| "Phase 0 / architecture 100%" | Strong docs; naming and model spread reduce coherence | G-029, G-013 |
| "CI validates quality" | Build + AST + optional tsc | G-001, G-004 |
| "Deploy-ready" | Render blueprint env gaps; Docker path split | G-006, G-021 |

---

## Recommended execution order (next 3 sprints)

### Sprint A — Trust the build (P0)
1. G-001 Add pytest to CI
2. G-004 Fix `tsc` gate
3. G-005 Visible error states on opportunities + market
4. G-006 Align `render.yaml` env

### Sprint B — Schema authority (P0 + P1)
1. G-002 Alembic for SSOT tables
2. G-003 Remove prod `create_all`
3. G-010 Token refresh
4. G-011 OAuth integration test

### Sprint C — Realism finish (P1 + P3)
1. G-007 Demo job labeling / empty state
2. G-008 Roadmap gap grounding
3. G-024 Light mode QA pass
4. G-012 Unify API client

---

## Ownership map (suggested)

| Area | Primary files | Backlog focus |
|------|---------------|---------------|
| CI/quality | `.github/workflows/ci.yml` | G-001, G-004, G-019 |
| Schema | `backend/migrations/`, `main.py` | G-002, G-003 |
| Opportunities | `opportunity_engine/`, `opportunities/page.tsx` | G-005, G-007 |
| Strategic/profile | `strategic.py`, `profile/page.tsx` | G-014 |
| Roadmap | `roadmap_intel/`, `generators/` | G-008, G-018 |
| Workspace | `workspace/copilot.py`, `workspace/page.tsx` | G-017, G-026 |
| Deploy | `Dockerfile`, `render.yaml` | G-006, G-021 |
| Orchestration | `routers/__init__.py`, `agents/` | G-015, G-016, G-022 |

---

## Status legend

- **Missing work** — not materially present
- **Unstable work** — exists but unreliable or environment-dependent
- **Fake completion** — artifacts exist (routes/tables/tests) but don't govern runtime or releases
- **Partial** — wired for happy path only

**NOT VERIFIED in this backlog:** Production load testing, security penetration testing, full accessibility audit.
