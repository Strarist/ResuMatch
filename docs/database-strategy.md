# Database Strategy

## Dual-Database Architecture

| Environment | Database | Connection String |
|---|---|---|
| Development | SQLite | `sqlite+aiosqlite:///./dev.db` |
| Production | PostgreSQL | `postgresql+asyncpg://user:pass@host/db` |

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

## When to Use PostgreSQL Locally

Use PostgreSQL (via `docker compose up -d`) when:
- Testing JSONB-specific queries
- Testing concurrent connections
- Testing production-like behavior
- Working on migrations
