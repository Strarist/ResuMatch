from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import logging

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.models.job_match import JobMatch

router = APIRouter()


@router.get("/")
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """
    Get dashboard overview data
    """
    try:
        # Count resumes
        total_resumes = db.query(Resume).filter(Resume.user_id == current_user.id).count()
        
        # Count jobs
        total_jobs = db.query(Job).filter(Job.user_id == current_user.id).count()
        
        # Count recent matches (last 30 days) - using resume_id to filter by user's resumes
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_matches = db.query(JobMatch).join(Resume).filter(
            Resume.user_id == current_user.id,
            JobMatch.created_at >= thirty_days_ago
        ).count()
        
        # Calculate average score - using resume_id to filter by user's resumes
        avg_score_result = db.query(func.avg(JobMatch.match_score)).join(Resume).filter(
            Resume.user_id == current_user.id
        ).scalar()
        average_score = float(avg_score_result) if avg_score_result else 0.0
        
        return {
            "total_resumes": total_resumes,
            "total_jobs": total_jobs,
            "recent_matches": recent_matches,
            "average_score": round(average_score, 2),
            "recent_activity": []
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard data: {str(e)}"
        )


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """
    Get dashboard statistics
    """
    try:
        # Count resumes
        total_resumes = db.query(Resume).filter(Resume.user_id == current_user.id).count()
        
        # Count all jobs (removed status filter since Job model doesn't have status field)
        active_jobs = db.query(Job).filter(Job.user_id == current_user.id).count()
        
        # Calculate match rate (percentage of resumes with matches) - using resume_id to filter by user's resumes
        total_resumes_with_matches = db.query(func.count(func.distinct(JobMatch.resume_id))).join(Resume).filter(
            Resume.user_id == current_user.id
        ).scalar() or 0
        
        match_rate = 0.0
        if total_resumes > 0:
            match_rate = round((total_resumes_with_matches / total_resumes) * 100, 1)
        
        # Calculate improvement score (average of recent match scores) - using resume_id to filter by user's resumes
        recent_matches = db.query(JobMatch).join(Resume).filter(
            Resume.user_id == current_user.id,
            JobMatch.created_at >= datetime.utcnow() - timedelta(days=7)
        ).all()
        
        improvement_score = 0.0
        if recent_matches:
            scores = [m.match_score for m in recent_matches if m.match_score is not None]
            if scores:
                avg_score = sum(scores) / len(scores)
                improvement_score = round(avg_score, 1)
        
        return {
            "totalResumes": total_resumes,
            "activeJobs": active_jobs,
            "matchRate": match_rate,
            "improvementScore": improvement_score
        }
    except Exception as e:
        logging.error(f"Dashboard stats error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard stats: {str(e)}"
        )


@router.get("/analytics")
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """
    Get dashboard analytics data
    """
    try:
        # Mock data for now - in a real implementation, you'd analyze actual data
        top_skills = [
            {"skill": "Python", "count": 15},
            {"skill": "JavaScript", "count": 12},
            {"skill": "React", "count": 10},
            {"skill": "Node.js", "count": 8},
            {"skill": "SQL", "count": 7}
        ]
        
        skill_trends = [
            {"skill": "Python", "count": 15},
            {"skill": "JavaScript", "count": 12},
            {"skill": "React", "count": 10},
            {"skill": "Node.js", "count": 8},
            {"skill": "SQL", "count": 7}
        ]
        
        match_distribution = [
            {"range": "90-100%", "count": 5},
            {"range": "80-89%", "count": 12},
            {"range": "70-79%", "count": 8},
            {"range": "60-69%", "count": 3},
            {"range": "50-59%", "count": 2}
        ]
        
        top_job_titles = [
            {"title": "Software Engineer", "count": 20},
            {"title": "Frontend Developer", "count": 15},
            {"title": "Backend Developer", "count": 12},
            {"title": "Full Stack Developer", "count": 10},
            {"title": "DevOps Engineer", "count": 8}
        ]
        
        return {
            "topSkills": top_skills,
            "skillTrends": skill_trends,
            "matchDistribution": match_distribution,
            "topJobTitles": top_job_titles
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard analytics: {str(e)}"
        )


@router.get("/recent-activity")
def get_recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[Dict[str, Any]]:
    """
    Get recent activity for the dashboard
    """
    try:
        # Mock recent activity data - in a real implementation, you'd track actual events
        recent_activity = [
            {
                "id": "1",
                "status": "completed",
                "type": "resume_upload",
                "title": "Resume uploaded",
                "description": "Software Engineer resume uploaded successfully",
                "date": "2 hours ago"
            },
            {
                "id": "2",
                "status": "completed",
                "type": "job_match",
                "title": "Job match found",
                "description": "Found 5 matching jobs for your resume",
                "date": "1 day ago"
            },
            {
                "id": "3",
                "status": "completed",
                "type": "analysis",
                "title": "Resume analyzed",
                "description": "Resume analysis completed with 85% confidence",
                "date": "2 days ago"
            }
        ]
        
        return recent_activity
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching recent activity: {str(e)}"
        ) 