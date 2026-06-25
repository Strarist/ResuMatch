# Backend Database Bootstrap

> **Canonical guide:** See [dev-bootstrap.md](dev-bootstrap.md) for full local setup.

## Schema authority

**Alembic is the single source of truth** for schema. Do not rely on `create_all` or runtime patches in normal development.

| Environment | Schema source |
|-------------|---------------|
| Local dev (Postgres) | `alembic upgrade head` |
| CI / pytest | `alembic upgrade head` on fresh SQLite, or `ENV=testing` + `create_all` in tests |
| Production (Docker) | `alembic upgrade head` in `docker-entrypoint.sh` |

## Fresh environment setup

```bash
# From repo root
docker compose up -d postgres redis

cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements-dev.txt

cp .env.example .env

# Apply all migrations (required)
alembic upgrade head

python -m uvicorn app.main:app --reload
```

## Existing database created outside Alembic

If tables already exist but `alembic_version` is missing (common after early dev):

```bash
cd backend

# Option A — stamp current schema then upgrade any missing revisions
alembic stamp head
alembic upgrade head

# Option B — wipe and recreate (dev only)
# From repo root:
docker compose down -v
docker compose up -d postgres redis
cd backend && alembic upgrade head
```

Verify:

```sql
SELECT version_num FROM alembic_version;
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'workspace_sessions' AND column_name = 'pinned';
```

## Dev database reset

```bash
docker compose down -v
docker compose up -d postgres redis
cd backend
alembic upgrade head
python -m uvicorn app.main:app --reload
```

## Required environment variables

```env
DATABASE_URL=postgresql+asyncpg://resumatch:resumatch_dev@localhost:5432/resumatch  # pragma: allowlist secret
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-at-least-16-chars
```

## Troubleshooting

### Connection refused (PostgreSQL)

- Ensure Docker is running: `docker compose up -d postgres`
- Verify `DATABASE_URL` in `backend/.env` matches `docker-compose.yml` credentials

### `column workspace_sessions.pinned does not exist`

- Run `alembic upgrade head` from `backend/`
- If migrations fail because tables exist without `alembic_version`, use `alembic stamp head` then `alembic upgrade head`

### Emergency SQLite (not recommended)

```env
DATABASE_URL=sqlite+aiosqlite:///./dev.db
```

Run `alembic upgrade head` after changing the URL.
