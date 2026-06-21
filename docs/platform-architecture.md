# Skillyn Platform Architecture

## System Overview

Skillyn is an AI career intelligence platform: resume → profile → roadmap → opportunities → market insights → dashboard command center.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                  │
│  App Router │ React 19 │ Tailwind │ shadcn/ui            │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP/REST + SSE
┌──────────────────────────┴──────────────────────────────┐
│                    Backend (FastAPI)                      │
│  Auth │ Resume Pipeline │ StrategicProfile │ Opportunities │
│  Roadmap Intel │ Market Intelligence │ Workspace Copilot  │
└──────────────────────────┬──────────────────────────────┘
                           │ SQLAlchemy Async
┌──────────────────────────┴──────────────────────────────┐
│              Database (PostgreSQL / SQLite dev)           │
│  StrategicProfile (canonical) │ Legacy intelligence tables│
└─────────────────────────────────────────────────────────┘
```

## Canonical Data Model

**`StrategicProfile`** is the single source of truth for career state after resume ingestion. Use `GET /v1/strategic/profile` for canonical reads. Legacy `GET /v1/intelligence/profile` remains for backward compatibility. Legacy `UserSkillProfile` / `RoadmapState` tables are read-only mirrors synced via `sync_legacy_intelligence_from_profile()` and `sync_legacy_roadmap_from_profile()`.

## Backend Architecture

```
backend/app/
├── main.py              → FastAPI app, lifespan, middleware
├── config.py            → Pydantic settings (loads .env)
├── db.py                → Async engine + session factory
├── models/              → ORM models (User, Resume, StrategicProfile, …)
├── schemas.py           → Pydantic request/response schemas
├── routers/             → HTTP route handlers (/v1/*)
│   ├── auth.py
│   ├── resumes.py
│   ├── strategic.py     → Career identity + focus
│   ├── opportunities.py → Live job matching
│   ├── market_intelligence.py
│   ├── roadmap_intel.py → Primary roadmap API
│   └── roadmap.py       → Legacy SSE (deprecated)
├── services/
│   ├── strategic_profile_service.py  → Canonical profile reads
│   ├── resume_pipeline/              → Primary resume intelligence
│   ├── opportunity_engine/           → Live crawl + 6-factor scoring
│   └── market_intelligence/
└── ai/                  → Legacy analysis stack (deprecated)
```

Phase 9 research routers (prediction, resilience, convergence, observability) are **gated off in production**.

## Frontend Architecture

```
frontend/src/
├── app/(app)/
│   ├── dashboard/       → Career command center (5 cards)
│   ├── profile/         → Career identity hub
│   ├── roadmap-v2/      → Primary roadmap UI
│   ├── opportunities/   → Live job matcher
│   ├── market-intelligence/
│   └── workspace/       → AI coach
├── context/LivingSystemContext.tsx  → Lifecycle sync with backend
├── lib/intelligence-client.ts       → Centralized API client
└── lib/lifecycle-sync.ts            → parse_status → lifecycle stage
```

## Known Dual-Stack Areas (Deprecation Intent)

| Layer | Canonical (use this) | Legacy (read-only mirror) | Status |
|-------|---------------------|---------------------------|--------|
| Career profile | `StrategicProfile` + `GET /v1/strategic/profile` | `UserSkillProfile`, `UserCareerProfile`, `GET /v1/intelligence/profile` | Legacy synced via `sync_legacy_intelligence_from_profile()` |
| Roadmap | `GET /v1/roadmap-intel/*` | `RoadmapState`, `POST /v1/roadmap/stream` (SSE) | Legacy synced via `sync_legacy_roadmap_from_profile()` |
| Resume analysis | `services/resume_pipeline/` | `backend/app/ai/`, `POST /v1/analyze` | Deprecated — dev-gated in frontend |
| Research APIs | N/A | prediction, resilience, convergence, observability | Excluded in production (`ENV=production`) |

All product routers (`opportunities`, `market_intelligence`, `roadmap_intel`, `trajectory`, orchestrator) read from `get_profile_context()` when a StrategicProfile exists.

## LivingSystem Lifecycle

| Stage | Meaning | Backend signal |
|-------|---------|----------------|
| 1 | Onboarding | No resume / no StrategicProfile |
| 2 | Parsing | Resume `parse_status` = processing |
| 3 | Calibrated | StrategicProfile with skills |
| 4 | Optimized | Roadmap milestones completed |

Dormant mock data is shown only when `!hasStrategicProfile && simulationActive === false`.

## Frontend Module Layout

```
frontend/src/
├── auth/                → Auth context, API client, token utils
├── components/          → Shared UI components
├── lib/                 → Hooks, utilities, contexts
└── types/               → Shared TypeScript types
```

## Database Strategy

- **Development**: SQLite (`sqlite+aiosqlite:///./dev.db`) — auto-creates tables on startup
- **Production**: PostgreSQL (`postgresql+asyncpg://...`)
- **Column types**: `String(36)` for UUIDs, `JSON` for structured data (portable across both)
- **Migrations**: Alembic (for production schema changes)
- **Startup**: `Base.metadata.create_all()` ensures tables exist (idempotent)

## Auth Flow

```
Google OAuth: /v1/auth/google/login → Google → /v1/auth/google/callback → JWT → /auth/callback?token=
Email/Pass:  POST /v1/auth/login → JWT response
Protected:   Bearer token in header OR access_token cookie
```

## Key Design Decisions

1. **Portable ORM types** — No PostgreSQL-specific types in models (JSON not JSONB, String not UUID)
2. **Auto table creation** — Lifespan creates tables on startup for zero-config dev
3. **Route groups** — `(app)/` for protected, `(auth)/` for public auth pages
4. **Layout-level auth** — `(app)/layout.tsx` wraps all protected routes with ProtectedRoute
5. **SSR-safe auth** — AuthContext uses `typeof window` guards, no localStorage during SSR
