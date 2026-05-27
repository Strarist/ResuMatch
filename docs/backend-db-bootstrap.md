# Backend Database Bootstrap

## How It Works

On startup, the backend automatically creates all tables via `Base.metadata.create_all()` in the FastAPI lifespan. This is idempotent — existing tables are not modified.

## Fresh Environment Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt

# Create .env with required vars
cp .env.example .env    # or create manually

# Start server (tables auto-created)
uvicorn app.main:app --reload
```

## Dev Database Reset

```bash
cd backend
rm dev.db              # Delete SQLite database
uvicorn app.main:app --reload   # Tables recreated on startup
```

## Required Environment Variables

```env
DATABASE_URL=sqlite+aiosqlite:///./dev.db
JWT_SECRET=your-secret-at-least-16-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/v1/auth/google/callback
```

## Schema (tables created automatically)

| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, OAuth, password) |
| `resumes` | Uploaded resume files and parsed data |
| `jobs` | Job descriptions for matching |
| `matches` | Resume-to-job match scores |
| `file_sanitization_audit` | PDF sanitization audit log |

## OAuth Schema Requirements

The `users` table supports both OAuth and email/password auth:
- `id` — UUID string (auto-generated)
- `email` — unique, indexed
- `provider` — "google", "email", etc.
- `password_hash` — nullable (null for OAuth users)
- `profile_img` — nullable (populated from OAuth)
- `created_at` / `updated_at` — timestamps

## Troubleshooting

### "no such table: users"
- The dev.db file may have been created with old (incompatible) schema
- Fix: delete `dev.db` and restart the server

### "UUID type not supported"
- Models must use `String(36)` for IDs, not `UUID` from PostgreSQL dialect
- `JSON` column type instead of `JSONB`
- No `ARRAY` types — use `JSON` with list values

### Production (PostgreSQL)
- Set `DATABASE_URL=postgresql+asyncpg://user:pass@host/db`
- Tables auto-create on first startup
- For schema migrations, use Alembic: `alembic upgrade head`
