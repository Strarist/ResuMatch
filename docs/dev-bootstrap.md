# Developer Bootstrap Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (for PostgreSQL)
- Git

## Quick Start

### 0. Infrastructure (required)

```bash
# From repo root — start PostgreSQL + Redis
docker compose up -d postgres redis
```

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt

# Create .env from template (Postgres URL preconfigured)
cp .env.example .env
# Edit OAuth / API keys as needed

# Start (tables auto-created; fails if Postgres is down)
python -m uvicorn app.main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install

# Create .env.local (optional — defaults to localhost:8000)
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

npm run dev -- -p 3001
```

### 3. Access

- Frontend: http://localhost:3001
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Reset Database

```bash
# PostgreSQL (canonical local)
docker compose down -v
docker compose up -d postgres redis
cd backend
python -m uvicorn app.main:app --reload  # Tables recreated via create_all()
```

## Emergency SQLite (not recommended)

Only if PostgreSQL is unavailable and you explicitly approve a temporary fallback:

```bash
# backend/.env
DATABASE_URL=sqlite+aiosqlite:///./dev.db
```

The application does not auto-switch to SQLite.

## Verify Setup

```bash
# Backend health
curl http://localhost:8000/health
curl http://localhost:8000/health/oauth

# Frontend
open http://localhost:3001
```
