from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
import logging
import asyncio
from uuid import UUID
import tempfile
import os
from pathlib import Path

from app.api.deps import get_current_active_user
from app.db.base import get_db
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import (
    Resume as ResumeSchema,
    ResumeCreate,
    ResumeUpdate,
    ResumeList as ResumeListSchema,
    ResumeAnalysis,
    ResumeResponse,
)
from app.services.resume import analyze_resume, extract_skills
from app.services.resume_parser import ResumeParser
from app.services.resume_matcher import ResumeMatcher
from app.crud import resume as resume_crud
from app.core.websocket import broadcast_analysis_update
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)
parser = ResumeParser()
matcher = ResumeMatcher()

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.doc'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.get("/", response_model=ResumeListSchema)
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    skills: Optional[List[str]] = None,
) -> Any:
    """
    Retrieve resumes with filtering and sorting
    """
    query = db.query(Resume).filter(Resume.user_id == current_user.id)

    if search:
        query = query.filter(Resume.title.ilike(f"%{search}%"))

    if skills:
        query = query.filter(Resume.skills.overlap(skills))

    if sort_by == "updatedAt":
        query = query.order_by(desc(Resume.updated_at))
    elif sort_by == "createdAt":
        query = query.order_by(desc(Resume.created_at))
    elif sort_by == "matchScore":
        query = query.order_by(desc(Resume.match_score))

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total}


@router.post("/", response_model=ResumeSchema)
def create_resume(
    *,
    db: Session = Depends(get_db),
    resume_in: ResumeCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new resume
    """
    resume = Resume(
        **resume_in.model_dump(),
        user_id=current_user.id,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.post("/analyze", response_model=ResumeAnalysis)
async def analyze_resume_text(
    *,
    text: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Analyze resume text without saving
    """
    try:
        analysis = await analyze_resume(text)
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error analyzing resume",
        )


@router.post("/analyze/file", response_model=ResumeAnalysis)
async def analyze_resume_file(
    *,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Analyze resume from file without saving
    """
    try:
        content = await file.read()
        text_content = content.decode("utf-8")
        analysis = await analyze_resume(text_content)
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing resume file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error analyzing resume file",
        )


async def validate_file(file: UploadFile) -> None:
    """Validate uploaded file type and size."""
    # Check file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Supported types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    file_size = 0
    chunk_size = 1024 * 1024  # 1MB chunks
    
    while chunk := await file.read(chunk_size):
        file_size += len(chunk)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE/1024/1024}MB"
            )
    
    # Reset file pointer
    await file.seek(0)


async def process_resume(
    file_path: str,
    user_id: UUID,
    resume_id: UUID,
    background_tasks: BackgroundTasks
) -> None:
    """Process uploaded resume in background."""
    try:
        # Update status: parsing
        await broadcast_analysis_update(
            user_id=user_id,
            analysis_id=str(resume_id),
            status="parsing",
            progress=20
        )
        
        # Parse resume
        parsed_data = await parser.parse_file(file_path)
        
        # Update status: extracting skills
        await broadcast_analysis_update(
            user_id=user_id,
            analysis_id=str(resume_id),
            status="extracting_skills",
            progress=40
        )
        
        # Extract skills and experience
        skills = await matcher.extract_skills(parsed_data.content)
        experience = await parser.extract_experience(parsed_data.content)
        
        # Update status: analyzing
        await broadcast_analysis_update(
            user_id=user_id,
            analysis_id=str(resume_id),
            status="analyzing",
            progress=60
        )
        
        # Create resume record
        resume_data = ResumeCreate(
            user_id=user_id,
            content=parsed_data.content,
            skills=skills,
            experience_years=experience.total_years,
            role_description=experience.current_role,
            education=parsed_data.education,
            parsed_data=parsed_data.dict()
        )
        
        await resume_crud.create_resume(resume_data)
        
        # Update status: completed
        await broadcast_analysis_update(
            user_id=user_id,
            analysis_id=str(resume_id),
            status="completed",
            progress=100,
            data={"resume_id": str(resume_id)}
        )
        
    except Exception as e:
        # Update status: error
        await broadcast_analysis_update(
            user_id=user_id,
            analysis_id=str(resume_id),
            status="error",
            error=str(e)
        )
        raise
    finally:
        # Cleanup temporary file
        try:
            os.remove(file_path)
        except:
            pass


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
) -> ResumeResponse:
    """Upload and process a resume file."""
    # Validate file
    await validate_file(file)
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name
    
    try:
        # Generate resume ID
        resume_id = UUID.uuid4()
        
        # Start background processing
        background_tasks.add_task(
            process_resume,
            temp_path,
            current_user.id,
            resume_id,
            background_tasks
        )
        
        return ResumeResponse(
            id=resume_id,
            status="processing",
            message="Resume upload started. Processing in background."
        )
        
    except Exception as e:
        # Cleanup on error
        try:
            os.remove(temp_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{resume_id}/status", response_model=ResumeResponse)
async def get_resume_status(
    resume_id: UUID,
    current_user: User = Depends(get_current_active_user)
) -> ResumeResponse:
    """Get the current status of a resume processing job."""
    resume = await resume_crud.get_resume(resume_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return ResumeResponse(
        id=resume_id,
        status="completed" if resume.parsed_data else "processing",
        message="Resume processing completed" if resume.parsed_data else "Resume is being processed"
    )


@router.get("/{resume_id}", response_model=ResumeSchema)
def get_resume(
    *,
    db: Session = Depends(get_db),
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get resume by ID
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )
    return resume


@router.put("/{resume_id}", response_model=ResumeSchema)
def update_resume(
    *,
    db: Session = Depends(get_db),
    resume_id: str,
    resume_in: ResumeUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update resume
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )
    for field, value in resume_in.model_dump(exclude_unset=True).items():
        setattr(resume, field, value)
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.delete("/{resume_id}", response_model=ResumeSchema)
def delete_resume(
    *,
    db: Session = Depends(get_db),
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete resume
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )
    db.delete(resume)
    db.commit()
    return resume


@router.post("/{resume_id}/analyze", response_model=ResumeSchema)
async def reanalyze_resume(
    *,
    db: Session = Depends(get_db),
    resume_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Re-analyze an existing resume
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    async def analyze_and_update():
        try:
            analysis = await analyze_resume(resume.content)
            resume.skills = analysis.get("skills", resume.skills)
            resume.experience = analysis.get("experience", resume.experience)
            resume.education = analysis.get("education", resume.education)
            db.add(resume)
            db.commit()
            db.refresh(resume)
        except Exception as e:
            logger.error(f"Error in background analysis: {str(e)}")

    background_tasks.add_task(analyze_and_update)
    return resume 