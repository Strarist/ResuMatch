# ResuMatch Auth Setup Guide

## Google OAuth Setup

### 1. Create Google Cloud OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Configure:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:8000/v1/auth/google/callback`
7. Copy the Client ID and Client Secret

### 2. Backend Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=sqlite+aiosqlite:///./dev.db
JWT_SECRET=<generate-a-strong-random-secret-at-least-16-chars>

GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<your-google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:8000/v1/auth/google/callback

FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
```

## Localhost Development Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Auth Flow Architecture

```
Unauthenticated User:
  localhost:3000 → Landing Page (public)
  localhost:3000/login → Login Page
  Click "Sign in with Google" → redirects to backend /v1/auth/google/login
  Backend redirects to Google consent screen
  Google redirects to backend /v1/auth/google/callback
  Backend creates/updates user, generates JWT
  Backend redirects to frontend /auth/callback?token=<jwt>
  Frontend stores token in localStorage, redirects to /dashboard

Authenticated User:
  localhost:3000 → Landing Page (public)
  localhost:3000/dashboard → Dashboard (protected)
  localhost:3000/login → Redirects to /dashboard
```

## Redirect URIs

| Environment | Backend Callback URI | Frontend Origin |
|---|---|---|
| Local | `http://localhost:8000/v1/auth/google/callback` | `http://localhost:3000` |
| Production | `https://api.yourdomain.com/v1/auth/google/callback` | `https://yourdomain.com` |

## Troubleshooting

### "Google OAuth not configured" (503)

- Check `backend/.env` has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Verify the backend loads `.env` (check `/health/oauth` endpoint)
- Restart the backend after changing `.env`

### Redirect URI mismatch

- Google Cloud Console redirect URI must exactly match `GOOGLE_REDIRECT_URI` in `.env`
- For local dev: `http://localhost:8000/v1/auth/google/callback`
- No trailing slash

### Landing page redirects to login

- The landing page (`/`) should never redirect — it's a public route
- If this happens, check that `AuthContext` is not calling `router.push('/login')` for unauthenticated users
- Verify no `ProtectedRoute` wraps the root layout

### Session expired loop

- Check JWT expiry time (`JWT_ACCESS_EXPIRE_MINUTES` in backend `.env`)
- Default is 7 days (10080 minutes)
- Frontend checks expiry every 60 seconds

## Health Endpoints

- `GET /health` — Database connectivity
- `GET /health/auth` — JWT configuration status
- `GET /health/oauth` — Google OAuth readiness
- `GET /health/providers` — All subsystem status
