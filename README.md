<div align="center">

<p align="center">
  <img src="./docs/assets/skillyn-logo.png" alt="Skillyn Logo" width="180" />
</p>

<h1 align="center">Skillyn</h1>

<p align="center">
  From Resume to Career Growth
</p>

# Skillyn

### From Resume to Career Growth

<p align="center">
  <b>An AI-powered career growth platform that transforms resumes into personalized roadmaps, opportunity matching, market insights, and career coaching.</b>
</p>

<br />

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active%20Development-22c55e?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Infrastructure-Docker%20%7C%20Redis-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
</p>

<br />

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#local-development">Local Development</a> •
  <a href="#project-structure">Project Structure</a>
</p>

</div>

---

# Overview

Modern job seekers often struggle with three questions:

* Where do I currently stand?
* What skills should I learn next?
* Which opportunities am I actually qualified for?

Skillyn addresses these problems by turning a resume into a complete career intelligence workflow.

```text
Resume
    ↓
Profile Intelligence
    ↓
Skill Analysis
    ↓
Personalized Roadmap
    ↓
Opportunity Matching
    ↓
Market Insights
    ↓
AI Career Coach
```

Rather than functioning as a simple resume checker, Skillyn acts as a personalized career growth platform designed to help users make better career decisions.

---

# Features

## Resume Intelligence

Upload and analyze resumes to generate structured career profiles.

### Capabilities

* PDF Resume Upload
* Resume Parsing
* Skill Extraction
* Experience Analysis
* Education Extraction
* Project Identification
* Profile Generation

---

## Personalized Career Roadmaps

Generate adaptive learning roadmaps based on:

* Existing Skills
* Experience Level
* Career Goals
* Skill Gaps
* Target Roles

Roadmaps are designed to evolve as users develop new skills.

---

## Opportunity Matching

Discover opportunities aligned with a user's profile.

### Features

* Match Scoring
* Skill Gap Analysis
* Opportunity Recommendations
* Career Alignment Insights
* Role Compatibility Evaluation

---

## Market Intelligence

Track what the market values.

### Insights

* High-Demand Skills
* Emerging Technologies
* Salary Indicators
* Recruiter Demand Signals
* Skill Premium Analysis

---

## AI Career Coach

Interactive career guidance powered by large language models.

### Use Cases

* Career Planning
* Skill Recommendations
* Learning Strategy Guidance
* Project Suggestions
* Resume Improvement
* Interview Preparation

---

# Product Screens

> Add screenshots after deployment.

Recommended screenshots:

* Landing Page
* Dashboard
* Resume Workspace
* Roadmap View
* Opportunity Matching
* Market Intelligence
* AI Coach

Example:

```md
![Dashboard](./docs/screenshots/dashboard.png)
```

---

# Architecture

```text
                         ┌──────────────────┐
                         │     Frontend     │
                         │     Next.js      │
                         └────────┬─────────┘
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │     FastAPI Backend    │
                     └────────┬───────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   PostgreSQL             Redis Cache         OpenRouter
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                              ▼
                   Career Intelligence Layer
```

---

# Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

## Backend

* FastAPI
* Python
* SQLAlchemy Async
* Pydantic

## Database

* PostgreSQL

## Infrastructure

* Docker
* Redis

## AI Layer

* OpenRouter
* NVIDIA Nemotron

## Authentication

* JWT Authentication
* Google OAuth

---

# Engineering Highlights

## Full Stack SaaS Architecture

* Modern Next.js Frontend
* FastAPI Backend
* PostgreSQL Persistence
* Redis Caching
* Dockerized Infrastructure

## Production-Oriented Backend

* Async SQLAlchemy
* Repository Pattern
* Service Layer Architecture
* Structured API Design
* Error Recovery Flows

## Authentication & Security

* JWT Authentication
* Google OAuth
* Protected Routes
* User Isolation
* Ownership Validation

## Resume Processing Pipeline

* Upload Lifecycle Tracking
* Resume Parsing
* Profile Generation
* Duplicate Protection
* Validation & Recovery Logic

---

# Local Development

## Clone Repository

```bash
git clone https://github.com/Strarist/Skillyn.git
cd Skillyn
```

---

## Start Infrastructure

```bash
docker compose up -d
```

---

## Backend Setup

```bash
cd backend

python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run backend:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# Environment Variables

## Backend

```env
DATABASE_URL=postgresql+asyncpg://resumatch:resumatch_dev@localhost:5432/resumatch

REDIS_URL=redis://localhost:6379

OPENROUTER_API_KEY=your_api_key
```

## Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

# Project Structure

```text
Skillyn/
│
├── backend/
│   ├── app/
│   ├── models/
│   ├── repositories/
│   ├── routers/
│   ├── services/
│   └── infrastructure/
│
├── frontend/
│   ├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── lib/
│
├── docs/
├── docker-compose.yml
├── .github/
└── README.md
```

---

# Current Focus

Current priorities include:

* Personalization Validation
* Opportunity Authenticity
* UX Refinement
* Production Hardening
* Responsive Optimization
* Deployment Readiness

---

# Why This Project Exists

Skillyn was built to explore and demonstrate:

* Full Stack Engineering
* SaaS Product Architecture
* AI-Assisted Applications
* Cloud-Native Development
* Production Backend Design
* Career Intelligence Systems

The objective is to build software that solves real career growth problems while applying modern engineering practices.

---

# Author

## Aditya Gupta

B.Tech — Cloud Infrastructure & Services

### Focus Areas

* Cloud Computing
* Full Stack Development
* DevOps
* Distributed Systems
* AI-Powered Applications

GitHub:

https://github.com/Strarist

---

# License

MIT License

---

<div align="center">

### Skillyn

From Resume to Career Growth

</div>
