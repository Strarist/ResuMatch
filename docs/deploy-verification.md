# Deploy & OAuth Verification (Phase 3)

Checklist for production/staging proof. Run after each deploy-affecting change.

## Backend deploy (Render)

| Step | Command / action | Expected |
|------|------------------|----------|
| Docker image build | `docker build -f Dockerfile .` | Image builds; spacy model downloads in builder stage |
| 2 | Container starts with [backend/docker-entrypoint.sh](../backend/docker-entrypoint.sh) | Logs show `alembic upgrade head` then gunicorn |
| 3 | `GET /health` | `{"status":"healthy","database":"connected",...}` |
| 4 | Fresh DB: `alembic_version` at head | `003_portfolio_workspace` |
| 5 | Schema spot-check | `workspace_sessions.pinned` column exists |

### Render env contract ([render.yaml](../render.yaml))

Required keys aligned with [backend/app/config.py](../backend/app/config.py):

- `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `FRONTEND_URL`, `CORS_ORIGINS` (comma-separated origins)
- `ENV=production`

**P3-DEP-02:** If the Vercel frontend URL changed, update `FRONTEND_URL` and `CORS_ORIGINS` in Render to match [frontend/src/lib/env.ts](../frontend/src/lib/env.ts) `NEXT_PUBLIC_API_URL` inverse mapping.

Current template defaults:

- Backend health: `https://<render-service>/health`
- Frontend: `https://resu-match-one.vercel.app` (update if rebranded)

## OAuth cross-domain (P3-DEP-03)

| Step | Where | Expected |
|------|-------|----------|
| 1 | Google Cloud Console | Authorized JS origin = production frontend URL |
| 2 | Google Cloud Console | Redirect URI = `{BACKEND}/v1/auth/google/callback` |
| 3 | Render `GOOGLE_REDIRECT_URI` | Matches Google Console exactly |
| 4 | Browser: `/login` → Google | Redirect to `/auth/callback?token=...` or visible `?error=` |
| 5 | Failed OAuth | Login page shows mapped error (not infinite spinner) |

**Status:** Manual — requires live Google credentials and deployed URLs.

## Local parity

```powershell
docker compose up -d postgres redis
cd backend
alembic upgrade head   # or alembic stamp head if schema already exists
python -m uvicorn app.main:app --reload --port 8000
```

Frontend: `npm run dev -- -p 3001` with `NEXT_PUBLIC_API_URL=http://localhost:8000`.

## Phase 3 automated smoke (pytest)

```powershell
cd backend
pytest -q -m critical --timeout=30
pytest tests/test_perf_baseline.py tests/test_migrations_fresh_db.py -v
```

Covers: auth, resume parse failure, workspace sessions, opportunities, migrations, warm-path latency budgets.
