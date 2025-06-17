from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List
from uuid import UUID

from app.services.resume_matcher import ResumeMatcher
from app.schemas.matching import MatchResult, BatchMatchRequest, BatchMatchResponse
from app.core.deps import get_current_user
from app.models.user import User
from app.crud import resume as resume_crud
from app.crud import job as job_crud

router = APIRouter()
matcher = ResumeMatcher()

@router.post("/match/{resume_id}/{job_id}", response_model=MatchResult)
async def match_resume_to_job(
    resume_id: UUID,
    job_id: UUID,
    current_user: User = Depends(get_current_user)
) -> MatchResult:
    """Match a single resume against a job posting."""
    # Get resume and job
    resume = await resume_crud.get_resume(resume_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    job = await job_crud.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Perform matching
    return await matcher.match_resume_to_job(resume, job)

@router.post("/batch-match", response_model=BatchMatchResponse)
async def batch_match_resumes(
    request: BatchMatchRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
) -> BatchMatchResponse:
    """Match multiple resumes against a job posting."""
    # Get job
    job = await job_crud.get_job(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get resumes
    resumes = []
    for resume_id in request.resume_ids:
        resume = await resume_crud.get_resume(resume_id)
        if not resume or resume.user_id != current_user.id:
            continue
        resumes.append(resume)
    
    if not resumes:
        raise HTTPException(status_code=404, detail="No valid resumes found")
    
    # Perform matching
    matches = await matcher.batch_match_resumes(resumes, job)
    
    # Calculate statistics
    total_matches = len(matches)
    average_score = sum(m.overall_score for m in matches) / total_matches if total_matches > 0 else 0
    
    return BatchMatchResponse(
        matches=matches,
        total_matches=total_matches,
        average_score=average_score
    ) 