# ResuMatch AI

![Vercel](https://img.shields.io/badge/Frontend-Vercel-blue?logo=vercel)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green?logo=fastapi)
![Postgres](https://img.shields.io/badge/Database-Postgres-blue?logo=postgresql)
![Google OAuth](https://img.shields.io/badge/Auth-Google%20OAuth-red?logo=google)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue?logo=githubactions)

> **ResuMatch** is a modern, AI-powered resume matcher and analytics platform. Upload your resume, get instant job matches, visualize your skills, and track your progress—all with secure Google login and a beautiful, responsive UI.

---

## 🚀 Features
- **Google OAuth**: Secure, one-click login (no passwords!)
- **Modern UI**: Next.js, Tailwind CSS, animated, mobile-first
- **AI Resume Matching**: Upload PDF, get job matches (FastAPI backend)
- **Personalized Dashboard**: Skill analytics, match history, and more
- **Security**: JWT auth, CORS, PDF sanitization, rate limiting
- **Observability**: Prometheus metrics, Sentry error tracking
- **CI/CD Ready**: Vercel (frontend), Render/Railway (backend), GitHub Actions

---

## 🛠️ Tech Stack
- **Frontend**: Next.js (TypeScript), Tailwind CSS, Zustand, react-hot-toast
- **Backend**: FastAPI (async), PostgreSQL, Celery, Redis
- **Auth**: Google OAuth 2.0 (no passwords, no Auth0)
- **Infra**: Docker, Prometheus, Sentry, CI/CD

---

## ⚡ Quick Start

### 1. Clone the Repo
```sh
git clone https://github.com/your-username/ResuMatch.git
cd ResuMatch
```

### 2. Backend Setup
- Copy `.env.example` to `.env` in `backend/` and fill in your secrets.
- Install Python deps and run migrations:
```sh
cd backend
python -m venv venv
venv\Scripts\activate  # or source venv/bin/activate
pip install -r requirements.txt
python app/migrate.py
```
- Start the backend:
```sh
uvicorn app.main:app --reload
```

### 3. Frontend Setup
- (Optional) Add `.env.local` in `frontend/` if you need `NEXT_PUBLIC_API_URL`.
- Install deps and run:
```sh
cd ../frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables
See `backend/.env.example` for all required variables:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OAUTH_REDIRECT_URI`
- `JWT_SECRET`, `POSTGRES_URL`, `CELERY_BROKER_URL`, etc.

---

## 🌐 Deployment

### Frontend (Vercel)
- Connect your GitHub repo to [Vercel](https://vercel.com/)
- Set any needed frontend env vars
- Deploy!

### Backend (Render/Railway)
- Connect your GitHub repo
- Set all backend env vars from `.env.example`
- Deploy!

### Google OAuth
- Add your deployed backend callback URL to the [Google Cloud Console](https://console.cloud.google.com/)
- Example: `https://your-backend-domain.com/v1/auth/google/callback`

---

## 📸 Screenshots
> _Add screenshots or a demo GIF here for extra recruiter appeal!_

---

## 🤝 Contributing
PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License
[MIT](LICENSE) 