from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, status, Request, Response, Depends, Cookie
from fastapi.responses import JSONResponse
import os
import uuid
from .tasks import process_pdf
from PyPDF2 import PdfReader
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from sqlalchemy.ext.asyncio import AsyncSession
from .db import get_db
from .models import User, Resume, Job, Match
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.utils.pdf_sanitizer import sanitize_pdf
import logging
from fastapi_limiter.depends import RateLimiter
from passlib.context import CryptContext
from sqlalchemy import select, update, delete
from typing import List, Optional
from .utils.resume_parser import resume_parser
from .utils.job_parser import parse_job_description
from .utils.skills_matcher import skills_matcher
import json

router = APIRouter(prefix="/v1", tags=["Resumes"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_PDF_PAGES = 20
MAX_TEXT_SIZE = 50 * 1024  # 50KB

config = Config('.env')
oauth = OAuth(config)

oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

JWT_SECRET = os.getenv('JWT_SECRET', 'changeme')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
REFRESH_TOKEN_EXPIRE_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_jwt(user, is_refresh_token=False):
    expire_minutes = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 if is_refresh_token else JWT_EXPIRE_MINUTES
    payload = {
        'sub': str(user.id),
        'email': user.email,
        'provider': user.provider,
        'type': 'refresh' if is_refresh_token else 'access',
        'exp': datetime.utcnow() + timedelta(minutes=expire_minutes)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    access_token: str = Cookie(default=None)
):
    token = None
    # Try to get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    # Fallback to cookie
    elif access_token:
        token = access_token
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('type') == 'refresh':
            raise HTTPException(status_code=401, detail="Refresh token not allowed for access")
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Auth endpoints
@router.post('/auth/login')
async def login_user(request: Request, db: AsyncSession = Depends(get_db)):
    data = await request.json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not pwd_context.verify(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_jwt(user)
    refresh_token = create_jwt(user, is_refresh_token=True)
    
    response = JSONResponse({
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "profile_img": user.profile_img,
            "provider": user.provider
        }
    })
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="lax")
    return response

@router.post('/auth/refresh')
async def refresh_token(request: Request, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token required")
    
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('type') != 'refresh':
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    access_token = create_jwt(user)
    new_refresh_token = create_jwt(user, is_refresh_token=True)
    
    response = JSONResponse({"access_token": access_token})
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax")
    response.set_cookie(key="refresh_token", value=new_refresh_token, httponly=True, secure=True, samesite="lax")
    return response

@router.post('/auth/logout')
async def logout_user():
    response = JSONResponse({"message": "Logout successful"})
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return response

@router.get('/auth/profile')
async def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "profile_img": current_user.profile_img,
            "provider": current_user.provider
        }
    }

@router.put('/auth/profile')
async def update_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    data = await request.json()
    name = data.get('name')
    profile_img = data.get('profile_img')
    
    if name:
        current_user.name = name
    if profile_img:
        current_user.profile_img = profile_img
    
    await db.commit()
    await db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "profile_img": current_user.profile_img,
            "provider": current_user.provider
        }
    }

# OAuth endpoints
@router.get('/auth/google/login', dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def google_login(request: Request):
    redirect_uri = os.getenv('OAUTH_REDIRECT_URI', 'http://localhost:3000/login')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get('/auth/google/callback')
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = await oauth.google.parse_id_token(request, token)
    
    result = await db.execute(select(User).where(User.email == user_info['email']))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            name=user_info.get('name'),
            email=user_info.get('email'),
            provider='google',
            profile_img=user_info.get('picture')
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    access_token = create_jwt(user)
    refresh_token = create_jwt(user, is_refresh_token=True)
    
    # Redirect to frontend with token
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    redirect_url = f"{frontend_url}/login?token={access_token}"
    return Response(status_code=302, headers={"Location": redirect_url})

# Resume endpoints
@router.post("/resumes", status_code=status.HTTP_202_ACCEPTED, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Magic number check: first 4 bytes must be %PDF
    first_bytes = await file.read(4)
    if first_bytes != b'%PDF':
        raise HTTPException(status_code=400, detail="File is not a valid PDF (magic number mismatch)")
    # MIME type check
    if file.content_type not in ["application/pdf", "application/x-pdf"]:
        raise HTTPException(status_code=400, detail="File MIME type is not PDF")
    # Read the rest of the file
    file_bytes = first_bytes + await file.read()
    # Structural validation and sanitization
    try:
        from io import BytesIO
        pdf = PdfReader(BytesIO(file_bytes))
        num_pages = len(pdf.pages)
        if num_pages > MAX_PDF_PAGES:
            raise HTTPException(status_code=400, detail=f"PDF exceeds max page limit of {MAX_PDF_PAGES}")
        # Extract text, limit to 50KB
        extracted_text = ""
        for page in pdf.pages:
            if len(extracted_text) > MAX_TEXT_SIZE:
                break
            extracted_text += page.extract_text() or ""
        if len(extracted_text.encode('utf-8')) > MAX_TEXT_SIZE:
            raise HTTPException(status_code=400, detail="PDF text content exceeds 50KB limit")
        # Check for JavaScript or embedded files (basic check)
        if "/JavaScript" in str(pdf) or "/JS" in str(pdf):
            raise HTTPException(status_code=400, detail="PDF contains JavaScript, which is not allowed")
        if any("/EmbeddedFile" in str(obj) for obj in pdf.pages):
            raise HTTPException(status_code=400, detail="PDF contains embedded files, which are not allowed")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF parsing failed: {str(e)}")
    # Save file to disk
    resume_id = uuid.uuid4().hex
    file_path = os.path.join(UPLOAD_DIR, f"{resume_id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    # Deep sanitization with pikepdf utility
    try:
        sanitized = sanitize_pdf(file_path, file_path)
        if not sanitized:
            logging.error(f"Sanitization failed for {file_path}")
            raise HTTPException(status_code=400, detail="PDF sanitization failed")
    except Exception as e:
        logging.error(f"Sanitization exception for {file_path}: {e}")
        raise HTTPException(status_code=500, detail="PDF sanitization failed")
    
    # Create resume record in database
    resume = Resume(
        id=resume_id,
        filename=file.filename,
        user_id=current_user.id,
        skills=[]  # Will be populated by AI processing
    )
    db.add(resume)
    await db.commit()
    
    # Queue Celery task
    process_pdf.delay(resume_id, file_path)
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"message": "Resume upload accepted for processing", "resume_id": resume_id}
    )

@router.get("/resumes", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def get_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Resume).where(Resume.user_id == current_user.id).order_by(Resume.uploaded_at.desc())
    )
    resumes = result.scalars().all()
    return {
        "resumes": [
            {
                "id": resume.id,
                "filename": resume.filename,
                "skills": resume.skills,
                "uploaded_at": resume.uploaded_at,
                "matches_count": len(resume.matches)
            }
            for resume in resumes
        ]
    }

@router.get("/resumes/{resume_id}", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return {
        "resume": {
            "id": resume.id,
            "filename": resume.filename,
            "skills": resume.skills,
            "uploaded_at": resume.uploaded_at,
            "matches": [
                {
                    "id": match.id,
                    "job_title": match.job.title,
                    "score": match.score,
                    "created_at": match.created_at
                }
                for match in resume.matches
            ]
        }
    }

@router.delete("/resumes/{resume_id}", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Delete file from disk
    file_path = os.path.join(UPLOAD_DIR, f"{resume_id}_{resume.filename}")
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete from database
    await db.execute(delete(Resume).where(Resume.id == resume_id))
    await db.commit()
    
    return {"message": "Resume deleted successfully"}

# Job matching endpoints
@router.get("/matches", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def get_matches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Match)
        .join(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(Match.score.desc())
    )
    matches = result.scalars().all()
    
    return {
        "matches": [
            {
                "id": match.id,
                "resume_filename": match.resume.filename,
                "job_title": match.job.title,
                "score": match.score,
                "created_at": match.created_at
            }
            for match in matches
        ]
    }

@router.post("/analyze", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def analyze_resume(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Analyze a resume against a job description and return match scores"""
    try:
        data = await request.json()
        resume_id = data.get('resume_id')
        job_description = data.get('job_description')
        
        if not resume_id or not job_description:
            raise HTTPException(status_code=400, detail="resume_id and job_description are required")
        
        # Get resume from database
        result = await db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
        )
        resume = result.scalar_one_or_none()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Get resume file path
        resume_file_path = os.path.join(UPLOAD_DIR, f"{resume_id}_{resume.filename}")
        if not os.path.exists(resume_file_path):
            raise HTTPException(status_code=404, detail="Resume file not found")
        
        # Parse resume using AI pipeline
        resume_analysis = resume_parser.parse_resume(resume_file_path)
        
        # Parse job description
        job_analysis = parse_job_description(job_description)
        
        # Calculate match scores
        match_results = skills_matcher.calculate_overall_match_score(
            resume_analysis, 
            job_analysis
        )
        
        # Get detailed skill matching
        detailed_matching = skills_matcher.get_detailed_matching(
            resume_analysis.get('skills', []),
            job_analysis.get('skills', [])
        )
        
        # Update resume with extracted skills if not already set
        if not resume.skills:
            resume.skills = resume_analysis.get('skills', [])
            await db.commit()
        
        # Create analysis result
        analysis_result = {
            "resume_id": resume_id,
            "resume_filename": resume.filename,
            "overall_match_score": match_results['overall_score'],
            "detailed_scores": {
                "skills_score": match_results['skills_score'],
                "experience_score": match_results['experience_score'],
                "education_score": match_results['education_score']
            },
            "resume_analysis": {
                "extracted_skills": resume_analysis.get('skills', []),
                "skill_confidence_scores": resume_analysis.get('skill_scores', {}),
                "education": resume_analysis.get('education', []),
                "experience": resume_analysis.get('experience', []),
                "metadata": resume_analysis.get('metadata', {})
            },
            "job_analysis": {
                "required_skills": job_analysis.get('skills', []),
                "required_education": job_analysis.get('education', []),
                "required_experience": job_analysis.get('experience', [])
            },
            "skill_matching": {
                "skill_matches": detailed_matching.get('skill_matches', []),
                "missing_skills": detailed_matching.get('missing_skills', []),
                "extra_skills": detailed_matching.get('extra_skills', []),
                "match_percentage": detailed_matching.get('match_percentage', 0.0)
            },
            "recommendations": _generate_recommendations(
                detailed_matching, 
                match_results, 
                resume_analysis, 
                job_analysis
            )
        }
        
        return analysis_result
        
    except Exception as e:
        logger.error(f"Error in resume analysis: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")

def _generate_recommendations(detailed_matching, match_results, resume_analysis, job_analysis):
    """Generate personalized recommendations based on analysis results"""
    recommendations = []
    
    # Skills recommendations
    missing_skills = detailed_matching.get('missing_skills', [])
    if missing_skills:
        recommendations.append({
            "type": "skill_gap",
            "title": "Skills to Develop",
            "description": f"Consider learning: {', '.join(missing_skills[:5])}",
            "priority": "high" if len(missing_skills) > 3 else "medium"
        })
    
    # Experience recommendations
    if match_results['experience_score'] < 0.7:
        recommendations.append({
            "type": "experience",
            "title": "Experience Enhancement",
            "description": "Consider highlighting more relevant work experience or taking on projects that demonstrate required skills",
            "priority": "medium"
        })
    
    # Education recommendations
    if match_results['education_score'] < 0.7:
        recommendations.append({
            "type": "education",
            "title": "Education Consideration",
            "description": "The job may require higher education qualifications. Consider if additional education would be beneficial",
            "priority": "low"
        })
    
    # Resume optimization
    if match_results['overall_score'] < 0.6:
        recommendations.append({
            "type": "resume_optimization",
            "title": "Resume Optimization",
            "description": "Consider restructuring your resume to better highlight relevant skills and experience",
            "priority": "high"
        })
    
    return recommendations

@router.post("/analyze/batch", dependencies=[Depends(RateLimiter(times=3, seconds=60))])
async def analyze_multiple_jobs(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Analyze a resume against multiple job descriptions"""
    try:
        data = await request.json()
        resume_id = data.get('resume_id')
        job_descriptions = data.get('job_descriptions', [])
        
        if not resume_id or not job_descriptions:
            raise HTTPException(status_code=400, detail="resume_id and job_descriptions are required")
        
        if len(job_descriptions) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 job descriptions allowed per request")
        
        # Get resume
        result = await db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
        )
        resume = result.scalar_one_or_none()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Parse resume once
        resume_file_path = os.path.join(UPLOAD_DIR, f"{resume_id}_{resume.filename}")
        if not os.path.exists(resume_file_path):
            raise HTTPException(status_code=404, detail="Resume file not found")
        
        resume_analysis = resume_parser.parse_resume(resume_file_path)
        
        # Analyze against each job description
        results = []
        for i, job_desc in enumerate(job_descriptions):
            try:
                job_analysis = parse_job_description(job_desc)
                match_results = skills_matcher.calculate_overall_match_score(
                    resume_analysis, 
                    job_analysis
                )
                
                results.append({
                    "job_index": i,
                    "overall_score": match_results['overall_score'],
                    "skills_score": match_results['skills_score'],
                    "experience_score": match_results['experience_score'],
                    "education_score": match_results['education_score'],
                    "required_skills": job_analysis.get('skills', [])
                })
            except Exception as e:
                logger.error(f"Error analyzing job {i}: {e}")
                results.append({
                    "job_index": i,
                    "error": "Analysis failed for this job description"
                })
        
        # Sort by overall score
        results.sort(key=lambda x: x.get('overall_score', 0), reverse=True)
        
        return {
            "resume_id": resume_id,
            "total_jobs_analyzed": len(job_descriptions),
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {e}")
        raise HTTPException(status_code=500, detail="Batch analysis failed")

# Registration endpoint
@router.post('/auth/register')
async def register_user(request: Request, db: AsyncSession = Depends(get_db)):
    data = await request.json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    if not all([name, email, password]):
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")
    
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    password_hash = pwd_context.hash(password)
    user = User(name=name, email=email, provider='email', password_hash=password_hash)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    access_token = create_jwt(user)
    refresh_token = create_jwt(user, is_refresh_token=True)
    
    response = JSONResponse({
        "message": "Registration successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "provider": user.provider
        }
    })
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="lax")
    return response 