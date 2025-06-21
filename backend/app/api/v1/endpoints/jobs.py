from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
import logging

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.job import Job
from app.schemas.job import (
    Job as JobSchema,
    JobCreate,
    JobUpdate,
    JobList as JobListSchema,
    JobAnalysis,
)
from app.services.job import analyze_job

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/analyze", response_model=JobAnalysis)
async def analyze_job_text(
    *,
    text: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Analyze job description without saving
    """
    try:
        analysis = await analyze_job(text)
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing job: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error analyzing job",
        )


@router.post("/", response_model=JobSchema)
async def create_job(
    *,
    db: Session = Depends(get_db),
    job_in: JobCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new job posting
    """
    try:
        # Create job first
        job = Job(**job_in.model_dump())
        db.add(job)
        db.commit()
        db.refresh(job)

        # Analyze in background
        async def analyze_and_update():
            try:
                analysis = await analyze_job(job.description)
                job.requirements = analysis.get("requirements", [])
                job.job_level = analysis.get("job_level")
                job.job_type = analysis.get("job_type")
                job.experience_required = analysis.get("experience_required", 0)
                db.add(job)
                db.commit()
                db.refresh(job)
            except Exception as e:
                logger.error(f"Error in background analysis: {str(e)}")

        background_tasks.add_task(analyze_and_update)
        return job

    except Exception as e:
        logger.error(f"Error creating job: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating job",
        )


@router.post("/{job_id}/analyze", response_model=JobSchema)
async def reanalyze_job(
    *,
    db: Session = Depends(get_db),
    job_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Re-analyze an existing job posting
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    async def analyze_and_update():
        try:
            analysis = await analyze_job(job.description)
            job.requirements = analysis.get("requirements", job.requirements)
            job.job_level = analysis.get("job_level", job.job_level)
            job.job_type = analysis.get("job_type", job.job_type)
            job.experience_required = analysis.get("experience_required", job.experience_required)
            db.add(job)
            db.commit()
            db.refresh(job)
        except Exception as e:
            logger.error(f"Error in background analysis: {str(e)}")

    background_tasks.add_task(analyze_and_update)
    return job


@router.get("/", response_model=JobListSchema)
def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
) -> Any:
    """
    Retrieve jobs with filtering and sorting
    """
    query = db.query(Job).filter(Job.user_id == current_user.id)

    if search:
        query = query.filter(Job.title.ilike(f"%{search}%"))

    if sort_by == "updatedAt":
        query = query.order_by(desc(Job.updated_at))
    elif sort_by == "createdAt":
        query = query.order_by(desc(Job.created_at))
    elif sort_by == "title":
        query = query.order_by(Job.title)

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total}


@router.get("/{job_id}", response_model=JobSchema)
def get_job(
    *,
    db: Session = Depends(get_db),
    job_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get job by ID
    """
    job = db.query(Job).filter(
        Job.id == job_id, Job.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    return job


@router.put("/{job_id}", response_model=JobSchema)
def update_job(
    *,
    db: Session = Depends(get_db),
    job_id: str,
    job_in: JobUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update job
    """
    job = db.query(Job).filter(
        Job.id == job_id, Job.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    for field, value in job_in.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}", response_model=JobSchema)
def delete_job(
    *,
    db: Session = Depends(get_db),
    job_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete job
    """
    job = db.query(Job).filter(
        Job.id == job_id, Job.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    db.delete(job)
    db.commit()
    return job 