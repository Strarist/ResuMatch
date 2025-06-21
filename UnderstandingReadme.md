# ResuMatch AI – Project Understanding & Architecture

## 🚀 Overview
ResuMatch AI is a full-stack, AI-powered web application that analyzes resumes against job descriptions using advanced NLP and ML. It provides actionable insights, match percentages, missing skills, and improvement suggestions to help users optimize their resumes for specific roles.

---

## 🏗️ Architecture & Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS (Vite)
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (via SQLAlchemy ORM)
- **ML/NLP:** spaCy (NER), HuggingFace sentence-transformers (embeddings)
- **Containerization:** Docker (multi-service: frontend, backend, db)
- **CI/CD:** GitHub Actions (planned)

---

## 🔄 Workflow & Data Flow
1. **User uploads a resume** (PDF/DOCX/TXT) and can view/manage all uploads.
2. **AI Analyze:**
   - User clicks "AI Analyze" on a resume card.
   - Modal opens, allowing user to paste/upload a job description.
   - On submit, frontend sends resume file + JD to `/api/v1/analyze-resume` (FastAPI).
   - Backend extracts text, runs spaCy NER, computes embeddings, calculates cosine similarity, detects missing skills, and generates suggestions.
   - Result (match %, missing skills, suggestions) is returned and displayed with animated UI.
   - Result is persisted in the `resume_analysis` table for history/analytics.
3. **History & Dashboard:**
   - Users can view past analyses, see match scores, missing skills, and suggestions.
   - Dashboard aggregates recent analyses, trends, and insights.

---

## ✨ Key Features
- **Resume Upload & Management:** Upload, view, delete, and tag resumes.
- **AI-Powered Analysis:** Compare resume to job description using ML/NLP.
- **Skill Gap Detection:** Highlights missing skills for the target job.
- **Improvement Suggestions:** Actionable tips to improve resume alignment.
- **Persistent Analysis History:** All analyses are saved for future reference.
- **Dashboard:** Visualizes recent analyses, scores, and trends.
- **Modern UI/UX:** Responsive, accessible, and visually appealing.
- **Dockerized:** Easy to run locally or deploy to cloud.

---

## 🧩 Backend Details
- **Endpoints:**
  - `/api/v1/resumes` – CRUD for resumes
  - `/api/v1/analyze-resume` – AI analysis (resume + JD)
  - `/api/v1/analysis-history/:resume_id` – Get past analyses for a resume
  - `/api/v1/user/analysis` – Get all user analyses (for dashboard)
- **Models:**
  - `Resume` – Stores resume metadata/content
  - `ResumeAnalysis` – Stores each analysis result (match %, missing skills, suggestions, timestamp)
- **ML Pipeline:**
  - Text extraction (PyMuPDF, python-docx)
  - spaCy NER for skills/entities
  - Embedding with sentence-transformers
  - Cosine similarity for match %
  - Skill gap and suggestion heuristics

---

## 🖥️ Frontend Details
- **ResumeGrid & ResumeCard:** List and manage resumes, trigger AI analysis.
- **AnalyzeResumeModal:** Handles AI analysis workflow, progress, and result display.
- **Dashboard:** Shows recent analyses, scores, missing skills, and trends.
- **State Management:** React Query for API data, optimistic updates.
- **UI/UX:** Tailwind CSS, animated progress rings, toasts, modals.

---

## 🛠️ Setup & Dev Notes
1. **Clone repo & install dependencies**
2. **Configure `.env` files** (see `.env.example`)
3. **Run with Docker:**
   ```bash
   docker compose up --build
   ```
4. **Access:**
   - Frontend: http://localhost:3000
   - Backend API/docs: http://localhost:8000/docs
5. **Migrations:**
   - Alembic for DB schema changes
   - `alembic upgrade head` to apply latest

---

## ✅ What Has Been Achieved
- End-to-end AI resume analysis workflow (upload → analyze → persist → visualize)
- Robust backend with ML/NLP pipeline and persistent analysis results
- Modern, responsive frontend with animated, user-friendly UI
- Dockerized, ready for local or cloud deployment
- Clean codebase, ready for CI/CD and GitHub push

---

## 📝 Future Enhancements
- PDF export/share analysis results
- Save multiple JDs per resume
- Advanced dashboard filters, analytics
- OAuth/Google Auth improvements
- CI/CD pipeline with GitHub Actions
- More granular error handling and user feedback

---

## 📈 Final Goal
A demo-ready, production-grade AI resume analyzer with persistent insights, recruiter-friendly dashboard, and a clean, maintainable codebase. 