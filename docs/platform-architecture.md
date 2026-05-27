# ResuMatch Platform Architecture

## System Overview

ResuMatch is an AI-native SaaS platform for resume analysis, job matching, and career intelligence.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                  │
│  App Router │ React 19 │ Tailwind │ shadcn/ui            │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP/REST + SSE
┌──────────────────────────┴──────────────────────────────┐
│                    Backend (FastAPI)                      │
│  Auth │ Resume │ Analysis │ Intelligence │ Roadmap       │
└──────────────────────────┬──────────────────────────────┘
                           │ SQLAlchemy Async
┌──────────────────────────┴──────────────────────────────┐
│              Database (PostgreSQL / SQLite dev)           │
│  12 tables │ JSON columns │ UUID string PKs              │
└─────────────────────────────────────────────────────────┘
```

## Backend Architecture

```
backend/app/
├── main.py              → FastAPI app, lifespan, middleware
├── config.py            → Pydantic settings (loads .env)
├── db.py                → Async engine + session factory
├── models.py            → Core ORM models (User, Resume, Job, Match)
├── schemas.py           → Pydantic request/response schemas
├── dependencies.py      → DI factories (repos, services, auth)
├── exceptions.py        → Domain exceptions
├── routers/             → HTTP route handlers
│   ├── auth.py          → Login, register, OAuth, profile
│   ├── resumes.py       → Upload, list, delete
│   ├── analysis.py      → Job match analysis
│   ├── intelligence.py  → Career intelligence
│   ├── roadmap.py       → Career roadmap
│   ├── roadmap_intel.py → Adaptive roadmap
│   ├── recruiter.py     → Recruiter intelligence
│   ├── cover_letter.py  → Cover letter generation
│   └── matches.py       → Match history
├── services/            → Business logic
│   ├── auth_service.py
│   ├── resume_service.py
│   ├── analysis_service.py
│   ├── intelligence/    → Career intelligence engine
│   ├── roadmap_intel/   → Adaptive roadmap engine
│   └── recruiter_intelligence/ → Recruiter signal engine
├── repositories/        → Database queries
├── ai/                  → ML pipeline (embeddings, parsing)
└── utils/               → PDF sanitizer
```

## Frontend Architecture

```
frontend/src/
├── app/
│   ├── page.tsx         → Landing page (public)
│   ├── layout.tsx       → Root layout (providers)
│   ├── global-error.tsx → Global error boundary
│   ├── (auth)/          → Public auth pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── auth/callback/
│   └── (app)/           → Protected workspace
│       ├── layout.tsx   → ProtectedRoute + AppShell
│       ├── dashboard/
│       ├── upload/
│       ├── analysis/
│       ├── resumes/
│       ├── profile/
│       ├── settings/
│       ├── matches/
│       ├── intelligence/
│       ├── roadmap/
│       └── recruiter-intelligence/
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
