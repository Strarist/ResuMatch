# ResuMatch AI

![CI/CD](https://github.com/yourusername/ResuMatchAI/actions/workflows/ci-cd.yml/badge.svg)

An AI-powered resume matching and optimization platform that helps job seekers improve their resumes and match them with job descriptions.

## Features

- Resume and Job Description Upload
- AI-powered Resume Analysis
- Job Description Matching
- Personalized Resume Improvement Tips
- Secure File Storage
- Modern Web Interface

## Tech Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS
- Axios for API calls

### Backend
- FastAPI (Python)
- spaCy for text processing
- Hugging Face Transformers for embeddings
- OpenAI API for resume improvement suggestions
- AWS S3 for file storage
- DynamoDB for metadata storage

### DevOps
- Docker
- GitHub Actions for CI/CD
- AWS EC2 for deployment

## Project Structure

```
resumatch-ai/
├── frontend/           # React.js frontend application
├── backend/           # FastAPI backend application
├── docker/           # Docker configuration files
├── .github/          # GitHub Actions workflows
└── docs/             # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.9 or higher)
- Docker
- AWS Account
- OpenAI API Key

### Development Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/resumatch-ai.git
cd resumatch-ai
```

2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

4. Environment Variables
Create `.env` files in both frontend and backend directories with necessary API keys and configuration.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## CI/CD Pipeline

GitHub Actions are used for linting, testing, building, and deploying both frontend and backend.

[View Workflow](.github/workflows/ci-cd.yml)

The pipeline includes:
- **Linting & Type Checking**: ESLint, TypeScript, Flake8, MyPy
- **Testing**: Jest (frontend), Pytest (backend) with coverage reporting
- **Security**: Dependency scanning and vulnerability checks
- **Build & Push**: Docker images to GitHub Container Registry
- **Deploy**: Automated deployment to staging (on main branch) and production (manual trigger)

### Required Secrets

| Secret | Used In | Description |
|--------|---------|-------------|
| `RENDER_API_URL` | staging | Staging Render endpoint |
| `RENDER_API_KEY` | staging | Staging Render API key |
| `RENDER_API_URL_PROD` | production | Production Render endpoint |
| `RENDER_API_KEY_PROD` | production | Production Render API key |
| `SLACK_WEBHOOK` | notifications | Slack webhook for deployment notifications |
| `STAGING_HEALTH_URL` | staging | Staging environment health check URL |
| `PRODUCTION_HEALTH_URL` | production | Production environment health check URL | 