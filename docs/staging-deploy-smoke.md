# Staging Deploy Smoke Checklist

Run after Sprint A + B before first production traffic.

## Prerequisites

- Render backend deployed from root `Dockerfile`
- Vercel frontend with `NEXT_PUBLIC_API_URL` pointing at Render backend
- `OPENROUTER_API_KEY`, `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL` set on Render
- Google OAuth redirect URI matches `GOOGLE_REDIRECT_URI` / production callback URL

## Automated smoke (local or staging URL)

```bash
cd backend
# Against local backend:
python scripts/smoke_check.py

# Against staging:
SMOKE_BASE_URL=https://your-backend.onrender.com python scripts/smoke_check.py
```

## Manual checklist

- [ ] `GET /health` returns 200
- [ ] Email register + login works
- [ ] Google OAuth completes (or shows visible error if misconfigured)
- [ ] Resume PDF upload returns 202 and parse completes
- [ ] `GET /v1/strategic/profile` returns profile after upload
- [ ] `GET /v1/opportunities/matches` returns data or explicit pending/degraded status
- [ ] `GET /v1/roadmap-intel/state` returns roadmap state
- [ ] Opportunities page shows error + retry when backend is stopped (not blank)
- [ ] Market page shows error + retry when backend is stopped (not blank)

## NOT VERIFIED until run on real staging

Record results and any env mismatches in your deploy notes.
