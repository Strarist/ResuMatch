from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
import logging
from datetime import datetime

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.models.job_match import JobMatch
from app.schemas.matching import (
    MatchResult,
    BatchMatchRequest,
    BatchMatchResponse,
    MatchStrategy
)
from app.services.resume_matcher import ResumeMatcher
from app.services.compatibility import CompatibilityService

router = APIRouter()
logger = logging.getLogger(__name__)

matcher = ResumeMatcher()
compatibility_service = CompatibilityService()

@router.post("/resume/{resume_id}/job/{job_id}", response_model=MatchResult)
async def match_resume_to_job(
    *,
    db: Session = Depends(get_db),
    resume_id: str,
    job_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Match a specific resume to a specific job
    """
    try:
        # Get resume and job
        resume = db.query(Resume).filter(
            Resume.id == resume_id, 
            Resume.user_id == current_user.id
        ).first()
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        job = db.query(Job).filter(
            Job.id == job_id,
            Job.user_id == current_user.id
        ).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        # Perform matching
        match_result = matcher.match_resume_to_job(resume, job)
        
        # Save match result to database
        job_match = JobMatch(
            resume_id=resume.id,
            job_id=job.id,
            match_score=match_result.overall_score,
            skill_match_score=match_result.skill_match.overall_score,
            experience_match_score=match_result.experience_match.years_match,
            education_match_score=match_result.education_match.match_score,
            role_match_score=match_result.role_match.title_similarity,
            matched_skills=match_result.skill_match.matched_skills,
            missing_skills=match_result.skill_match.missing_skills,
            suggestions=match_result.suggestions,
            created_at=datetime.utcnow()
        )
        
        db.add(job_match)
        db.commit()
        db.refresh(job_match)
        
        return match_result
        
    except Exception as e:
        logger.error(f"Error matching resume to job: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error performing match"
        )

@router.post("/batch", response_model=BatchMatchResponse)
async def batch_match(
    *,
    db: Session = Depends(get_db),
    request: BatchMatchRequest,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Batch match multiple resumes to multiple jobs
    """
    try:
        start_time = datetime.utcnow()
        
        # Get resumes and jobs
        resumes = db.query(Resume).filter(
            Resume.id.in_(request.resume_ids),
            Resume.user_id == current_user.id
        ).all()
        
        jobs = db.query(Job).filter(
            Job.id.in_(request.job_ids),
            Job.user_id == current_user.id
        ).all()
        
        if not resumes:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No valid resumes found"
            )
        
        if not jobs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No valid jobs found"
            )
        
        # Perform batch matching
        matches = matcher.batch_match_resumes(resumes, jobs)
        
        # Convert to response format
        match_results = []
        for match in matches:
            match_data = {
                "resume_id": match.resume_id,
                "job_id": match.job_id,
                "overall_score": match.overall_score,
                "skill_match": {
                    "overall_score": match.skill_match.overall_score,
                    "matched_skills": match.skill_match.matched_skills,
                    "missing_skills": match.skill_match.missing_skills,
                    "suggestions": match.skill_match.suggestions
                },
                "experience_match": {
                    "years_match": match.experience_match.years_match,
                    "level_match": match.experience_match.level_match,
                    "required_years": match.experience_match.required_years,
                    "actual_years": match.experience_match.actual_years,
                    "suggestions": match.experience_match.suggestions
                },
                "education_match": {
                    "match_score": match.education_match.match_score,
                    "level_match": match.education_match.level_match,
                    "field_relevance": match.education_match.field_relevance,
                    "missing_requirements": match.education_match.missing_requirements,
                    "suggestions": match.education_match.suggestions
                },
                "role_match": {
                    "title_similarity": match.role_match.title_similarity,
                    "level_match": match.role_match.level_match,
                    "required_level": match.role_match.required_level,
                    "actual_level": match.role_match.actual_level,
                    "explanation": match.role_match.explanation,
                    "suggestions": match.role_match.suggestions
                },
                "suggestions": match.suggestions,
                "timestamp": match.timestamp.isoformat()
            }
            match_results.append(match_data)
        
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        return BatchMatchResponse(
            matches=match_results,
            total_processed=len(matches),
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error in batch matching: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error performing batch match"
        )

@router.get("/resume/{resume_id}/matches", response_model=List[MatchResult])
async def get_resume_matches(
    *,
    db: Session = Depends(get_db),
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
    limit: int = 10,
) -> Any:
    """
    Get all matches for a specific resume
    """
    try:
        # Verify resume exists and belongs to user
        resume = db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id
        ).first()
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        # Get job matches for this resume
        job_matches = db.query(JobMatch).filter(
            JobMatch.resume_id == resume_id
        ).order_by(desc(JobMatch.match_score)).limit(limit).all()
        
        # Get jobs for these matches
        job_ids = [match.job_id for match in job_matches]
        jobs = db.query(Job).filter(Job.id.in_(job_ids)).all()
        job_dict = {job.id: job for job in jobs}
        
        # Convert to MatchResult format
        matches = []
        for job_match in job_matches:
            job = job_dict.get(job_match.job_id)
            if job:
                match_result = matcher.match_resume_to_job(resume, job)
                matches.append(match_result)
        
        return matches
        
    except Exception as e:
        logger.error(f"Error getting resume matches: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving matches"
        )

@router.get("/job/{job_id}/matches", response_model=List[MatchResult])
async def get_job_matches(
    *,
    db: Session = Depends(get_db),
    job_id: str,
    current_user: User = Depends(get_current_active_user),
    limit: int = 10,
) -> Any:
    """
    Get all matches for a specific job
    """
    try:
        # Verify job exists and belongs to user
        job = db.query(Job).filter(
            Job.id == job_id,
            Job.user_id == current_user.id
        ).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        # Get resume matches for this job
        job_matches = db.query(JobMatch).filter(
            JobMatch.job_id == job_id
        ).order_by(desc(JobMatch.match_score)).limit(limit).all()
        
        # Get resumes for these matches
        resume_ids = [match.resume_id for match in job_matches]
        resumes = db.query(Resume).filter(Resume.id.in_(resume_ids)).all()
        resume_dict = {resume.id: resume for resume in resumes}
        
        # Convert to MatchResult format
        matches = []
        for job_match in job_matches:
            resume = resume_dict.get(job_match.resume_id)
            if resume:
                match_result = matcher.match_resume_to_job(resume, job)
                matches.append(match_result)
        
        return matches
        
    except Exception as e:
        logger.error(f"Error getting job matches: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving matches"
        )

@router.get("/analytics", response_model=Dict[str, Any])
async def get_matching_analytics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get matching analytics for the user
    """
    try:
        # Get user's resumes and jobs
        resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
        jobs = db.query(Job).filter(Job.user_id == current_user.id).all()
        
        # Get all matches
        job_matches = db.query(JobMatch).filter(
            JobMatch.resume_id.in_([r.id for r in resumes])
        ).all()
        
        # Calculate analytics
        total_matches = len(job_matches)
        avg_match_score = sum(match.match_score for match in job_matches) / total_matches if total_matches > 0 else 0
        
        # Top matches
        top_matches = sorted(job_matches, key=lambda x: x.match_score, reverse=True)[:5]
        
        # Skills analysis
        all_matched_skills = []
        all_missing_skills = []
        for match in job_matches:
            if match.matched_skills:
                all_matched_skills.extend(match.matched_skills)
            if match.missing_skills:
                all_missing_skills.extend(match.missing_skills)
        
        # Count skill frequencies
        from collections import Counter
        matched_skill_counts = Counter(all_matched_skills)
        missing_skill_counts = Counter(all_missing_skills)
        
        return {
            "total_resumes": len(resumes),
            "total_jobs": len(jobs),
            "total_matches": total_matches,
            "average_match_score": round(avg_match_score, 2),
            "top_matches": [
                {
                    "resume_id": match.resume_id,
                    "job_id": match.job_id,
                    "score": match.match_score,
                    "matched_skills": match.matched_skills,
                    "missing_skills": match.missing_skills
                }
                for match in top_matches
            ],
            "top_matched_skills": dict(matched_skill_counts.most_common(10)),
            "top_missing_skills": dict(missing_skill_counts.most_common(10)),
            "match_distribution": {
                "excellent": len([m for m in job_matches if m.match_score >= 0.8]),
                "good": len([m for m in job_matches if 0.6 <= m.match_score < 0.8]),
                "fair": len([m for m in job_matches if 0.4 <= m.match_score < 0.6]),
                "poor": len([m for m in job_matches if m.match_score < 0.4])
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting matching analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving analytics"
        ) 