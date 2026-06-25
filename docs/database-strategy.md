# Database Strategy

## Dual-Database Architecture

| Environment | Database | Connection String |
|---|---|---|
| Local development | PostgreSQL (Docker) | `postgresql+asyncpg://resumatch:resumatch_dev@localhost:5432/resumatch` | <!-- pragma: allowlist secret -->
| Production | PostgreSQL | `postgresql+asyncpg://user:pass@host/db` | <!-- pragma: allowlist secret -->
| pytest only | SQLite | `sqlite+aiosqlite:///./test.db` (set in `tests/conftest.py`) |

## Portable Column Types

All models use database-agnostic types:

| Need | Type Used | NOT |
|------|-----------|-----|
| UUID primary keys | `String(36)` | `UUID(as_uuid=True)` |
| Structured data | `JSON` | `JSONB` |
| Lists/arrays | `JSON` (store as list) | `ARRAY(Text)` |
| Timestamps | `DateTime(timezone=True)` | — |
| Upserts | SELECT + INSERT/UPDATE | `pg_insert().on_conflict_do_update()` |

## Table Creation

Tables are created automatically on startup via:

```python
async with engine.begin() as conn:
    await conn.run_sync(Base.metadata.create_all)
```

This is idempotent — existing tables are not modified.

## Schema (12 tables)

### Core
- `users` — accounts (email/OAuth)
- `resumes` — uploaded files + parsed data
- `jobs` — job descriptions
- `matches` — resume-to-job scores
- `file_sanitization_audit` — PDF security log

### Intelligence
- `user_skill_profiles` — normalized skill tracking
- `user_career_profiles` — career trajectory
- `analysis_memory_events` — analysis history

### Roadmap
- `roadmap_states` — adaptive career roadmaps
- `roadmap_events` — roadmap mutations

### Recruiter Intelligence
- `recruiter_intelligence_snapshots` — recruiter signals
- `reasoning_events` — reasoning traces

## Migration Strategy

- **Dev**: Auto-create via `create_all()` (no migrations needed)
- **Production**: Use Alembic for schema changes

```bash
# Generate migration
alembic revision --autogenerate -m "description"

# Apply
alembic upgrade head
```

## Local Development

Start PostgreSQL and Redis from the repo root:

```bash
docker compose up -d postgres redis
```

`backend/.env.example` defaults to the Docker Postgres and Redis URLs. The backend **does not** silently fall back to SQLite if Postgres is unreachable — startup fails with a connection error.

Redis is expected locally. If Redis is temporarily unavailable, the app degrades to in-memory cache and rate limits (no startup failure).

## Emergency SQLite (manual override only)

Only use when explicitly approved and Postgres is unavailable:

```bash
# backend/.env — manual change only
DATABASE_URL=sqlite+aiosqlite:///./dev.db
```

This is not the canonical local target and is not auto-triggered by the application.

## When to Use PostgreSQL Locally

PostgreSQL is the **default** local database. Use Docker Compose when:
- Testing JSONB-specific queries
- Testing concurrent connections
- Testing production-like behavior
- Working on migrations
