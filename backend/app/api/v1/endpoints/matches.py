from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_current_active_user
from app.db.base import get_db
from app.models.user import User
from app.models.job import Job
from app.models.resume import Resume
from app.models.job_match import JobMatch
from app.schemas.job import JobMatch as JobMatchSchema
from app.services.job import match_resumes
from app.services.resume import analyze_resume
from app.services.job import analyze_job
from app.api import deps
from app.schemas.compatibility import (
    CompatibilityRequest, CompatibilityResponse, CompatibilityReport
)
from app.services.compatibility import CompatibilityAnalyzer
from app.crud import resume as resume_crud
from app.crud import job as job_crud
from app.core.cache import get_cache, Cache

router = APIRouter()
analyzer = CompatibilityAnalyzer()


@router.post("/resume-job", response_model=List[JobMatchSchema])
async def match_resume_job(
    *,
    db: Session = Depends(get_db),
    resume_id: str,
    job_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Match a specific resume with a specific job
    """
    # Get resume
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    # Get job
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    # Perform matching
    matches = await match_resumes(job, [resume])
    if not matches:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No matches found",
        )

    # Save match to database
    match = matches[0]  # We only have one match since we're matching one resume
    job_match = JobMatch(
        job_id=job.id,
        resume_id=resume.id,
        score=match["score"],
    )
    db.add(job_match)
    db.commit()

    return matches


@router.post("/resume/{resume_id}/jobs", response_model=List[JobMatchSchema])
async def match_resume_with_jobs(
    *,
    db: Session = Depends(get_db),
    resume_id: str,
    job_ids: List[str],
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Match a specific resume with multiple jobs
    """
    # Get resume
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    # Get jobs
    jobs = db.query(Job).filter(Job.id.in_(job_ids)).all()
    if not jobs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No jobs found",
        )

    all_matches = []
    for job in jobs:
        # Perform matching for each job
        matches = await match_resumes(job, [resume])
        if matches:
            match = matches[0]  # We only have one match per job
            # Save match to database
            job_match = JobMatch(
                job_id=job.id,
                resume_id=resume.id,
                score=match["score"],
            )
            db.add(job_match)
            all_matches.extend(matches)

    db.commit()

    # Sort all matches by score
    all_matches.sort(key=lambda x: x["score"], reverse=True)
    return all_matches


@router.post("/job/{job_id}/resumes", response_model=List[JobMatchSchema])
async def match_job_with_resumes(
    *,
    db: Session = Depends(get_db),
    job_id: str,
    resume_ids: List[str],
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Match a specific job with multiple resumes
    """
    # Get job
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    # Get resumes
    resumes = db.query(Resume).filter(
        Resume.id.in_(resume_ids),
        Resume.user_id == current_user.id
    ).all()
    if not resumes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resumes found",
        )

    # Perform matching
    matches = await match_resumes(job, resumes)
    if not matches:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No matches found",
        )

    # Save matches to database
    for match in matches:
        job_match = JobMatch(
            job_id=job.id,
            resume_id=match["resume_id"],
            score=match["score"],
        )
        db.add(job_match)

    db.commit()
    return matches


@router.get("/resume/{resume_id}", response_model=List[JobMatchSchema])
def get_resume_matches(
    *,
    db: Session = Depends(get_db),
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    min_score: Optional[float] = None,
) -> Any:
    """
    Get all matches for a specific resume
    """
    # Verify resume ownership
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    # Query matches
    query = db.query(JobMatch).filter(JobMatch.resume_id == resume_id)
    if min_score is not None:
        query = query.filter(JobMatch.score >= min_score)

    total = query.count()
    matches = query.order_by(desc(JobMatch.score)).offset(skip).limit(limit).all()

    return matches


@router.get("/job/{job_id}", response_model=List[JobMatchSchema])
def get_job_matches(
    *,
    db: Session = Depends(get_db),
    job_id: str,
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    min_score: Optional[float] = None,
) -> Any:
    """
    Get all matches for a specific job
    """
    # Verify job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    # Query matches
    query = db.query(JobMatch).filter(JobMatch.job_id == job_id)
    if min_score is not None:
        query = query.filter(JobMatch.score >= min_score)

    total = query.count()
    matches = query.order_by(desc(JobMatch.score)).offset(skip).limit(limit).all()

    return matches


@router.post("/compare", response_model=CompatibilityResponse)
async def compare_resume_job(
    request: CompatibilityRequest,
    db: Session = Depends(deps.get_db),
    cache: Cache = Depends(get_cache)
) -> CompatibilityResponse:
    """
    Compare a resume against a job posting and generate a compatibility report.
    """
    # Get resume and job
    resume = resume_crud.get(db, id=request.resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    job = job_crud.get(db, id=request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")
    
    # Check cache first
    cache_key = f"compatibility:{request.resume_id}:{request.job_id}"
    cached_report = await cache.get(cache_key)
    if cached_report:
        return CompatibilityResponse(
            report=CompatibilityReport.parse_raw(cached_report),
            processing_time=0.0,
            cached=True
        )
    
    # Generate report
    import time
    start_time = time.time()
    
    report = await analyzer.generate_report(resume, job)
    
    # Cache the report
    await cache.set(
        cache_key,
        report.json(),
        expire=3600  # Cache for 1 hour
    )
    
    processing_time = time.time() - start_time
    
    return CompatibilityResponse(
        report=report,
        processing_time=processing_time,
        cached=False
    ) 