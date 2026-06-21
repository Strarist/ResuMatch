# Skillyn - AI-Powered Career Growth Platform

> From Resume to Career Growth

A full-stack career growth and upskilling platform that transforms resumes into personalized learning roadmaps, opportunities, market insights, and career coaching.

## 🚀 Features

### Core Functionality
- **AI Resume Parsing**: Extract skills, education, and experience from PDF resumes
- **Job Description Analysis**: Parse job postings for required skills and qualifications
- **Semantic Skills Matching**: Use sentence-transformers for intelligent skill comparison
- **Match Scoring**: Comprehensive scoring system (skills, experience, education)
- **Personalized Recommendations**: Actionable insights to improve job applications

### User Experience
- **Secure Authentication**: JWT-based auth with Google/LinkedIn OAuth
- **Resume Upload**: Drag-and-drop PDF upload with security validation
- **Real-time Analysis**: Live job matching with detailed results
- **Dashboard**: Overview of resumes, skills, and analysis history
- **Professional UI**: Modern, responsive design with Tailwind CSS

### Security & Performance
- **Rate Limiting**: API protection against abuse
- **File Sanitization**: Deep PDF sanitization for security
- **Input Validation**: Comprehensive validation and error handling
- **Scalable Architecture**: FastAPI backend with async processing

## 🏗️ Architecture

### Frontend (Next.js 15)
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context for authentication
- **UI Components**: Custom components with Radix UI primitives

### Backend (FastAPI)
- **Framework**: FastAPI with async/await
- **Database**: SQLite (local dev default) or PostgreSQL (production)
- **AI/ML**: OpenRouter LLM + spaCy, heuristic fallbacks
- **Authentication**: JWT with Google OAuth
- **API prefix**: `/v1/*` (not `/api/v1`)

### AI Pipeline
1. **Resume Parser**: Extract structured data from PDFs
2. **Job Parser**: Analyze job descriptions for requirements
3. **Skills Matcher**: Semantic similarity using embeddings
4. **Scoring Engine**: Weighted scoring system
5. **Recommendations**: Personalized improvement suggestions

## 🛠️ Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (production) or SQLite (local dev — default in `.env.example`)
- Redis (optional, for caching and rate limiting)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Set up environment variables
cp .env.example .env
# Edit .env with your database and OAuth credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📖 Usage

### 1. User Registration/Login
- Visit the application and sign up with email or OAuth
- Complete authentication flow

### 2. Upload Resume
- Navigate to Upload page
- Drag and drop a PDF resume (max 5MB)
- AI automatically extracts skills, education, and experience
- Resume is securely stored and processed

### 3. Analyze Job Matches
- Go to Analysis page
- Select your uploaded resume
- Paste a job description
- Get comprehensive matching results:
  - Overall match score (0-100%)
  - Skills matching with similarity scores
  - Missing skills and recommendations
  - Experience and education analysis

### 4. Review Results
- View detailed skill-by-skill matching
- See personalized recommendations
- Identify skill gaps and improvement areas
- Track analysis history in dashboard

## 🔧 API Endpoints

All endpoints use the `/v1` prefix (not `/api/v1`):

### Authentication
- `POST /v1/auth/login` - User login
- `POST /v1/auth/register` - User registration
- `GET /v1/auth/google/login` - Google OAuth

### Career Intelligence
- `POST /v1/resumes` - Upload resume
- `GET /v1/strategic/profile` - Career identity profile
- `GET /v1/opportunities/matches` - Job opportunity matches
- `GET /v1/market-intelligence/snapshot` - Market intelligence
- `GET /v1/roadmap-intel/state` - Adaptive roadmap state

Legacy (deprecated): `/v1/analyze`, `/v1/roadmap/stream`

## 🎯 AI Pipeline Details

### Resume Parsing
- **Text Extraction**: Secure PDF text extraction
- **NLP Processing**: spaCy for entity recognition
- **Skill Detection**: Pattern matching + ML-based extraction
- **Confidence Scoring**: Reliability scores for extracted data

### Job Analysis
- **Requirement Extraction**: Parse job descriptions for skills
- **Education Matching**: Degree level analysis
- **Experience Parsing**: Years of experience extraction

### Skills Matching
- **Embeddings**: sentence-transformers for semantic similarity
- **Cosine Similarity**: Measure skill relevance
- **Threshold Scoring**: Good match threshold at 0.7
- **Weighted Scoring**: Skills (60%), Experience (25%), Education (15%)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: API protection (5 req/min for analysis)
- **File Validation**: Magic number and MIME type checks
- **PDF Sanitization**: Deep content sanitization
- **Input Sanitization**: XSS and injection protection
- **CORS Configuration**: Proper cross-origin settings

## 📊 Performance

- **AI Pipeline**: 80%+ accuracy in skill matching
- **Response Time**: <2s for analysis requests
- **Scalability**: Async processing with background tasks
- **Caching**: Redis integration for improved performance

## 🚀 Deployment

### Environment Variables
```bash
# Database (keeps internal database name for stability)
DATABASE_URL=postgresql://user:pass@localhost/resumatch

# Authentication
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# File Storage
UPLOAD_DIR=./uploads

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Production Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy backend to your preferred platform
5. Deploy frontend to Vercel/Netlify
6. Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@skillyn.com or create an issue in the repository.

---

**Skillyn** - From Resume to Career Growth 🚀
