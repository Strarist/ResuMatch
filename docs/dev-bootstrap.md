# Developer Bootstrap Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- Git

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt

# Create .env
cat > .env << 'EOF'
DATABASE_URL=sqlite+aiosqlite:///./dev.db
JWT_SECRET=dev-secret-minimum-16-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/v1/auth/google/callback
FRONTEND_URL=http://localhost:3000
EOF

# Start (tables auto-created)
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install

# Create .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

npm run dev
```

### 3. Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## PostgreSQL Dev (Optional)

```bash
# Start PostgreSQL via Docker
docker compose up -d

# Update backend/.env
DATABASE_URL=postgresql+asyncpg://resumatch:resumatch_dev@localhost:5432/resumatch
```

## Reset Database

```bash
cd backend
rm dev.db                    # Delete SQLite
uvicorn app.main:app --reload  # Tables recreated
```

## Verify Setup

```bash
# Backend health
curl http://localhost:8000/health
curl http://localhost:8000/health/oauth

# Frontend
curl http://localhost:3000
```
