# CRUD operations module
from typing import List, Optional, Any
from sqlalchemy.orm import Session
from app.models.resume import Resume
from app.models.job import Job
from app.models.user import User

def get_resume(db: Session, resume_id: int) -> Optional[Resume]:
    """Get a resume by ID."""
    return db.query(Resume).filter(Resume.id == resume_id).first()

def get_user_resumes(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Resume]:
    """Get resumes for a user with pagination."""
    return db.query(Resume).filter(Resume.user_id == user_id).offset(skip).limit(limit).all()

def create_resume(db: Session, resume_data: dict) -> Resume:
    """Create a new resume."""
    resume = Resume(**resume_data)
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume

def update_resume(db: Session, resume_id: int, resume_data: dict) -> Optional[Resume]:
    """Update a resume."""
    resume = get_resume(db, resume_id)
    if resume:
        for key, value in resume_data.items():
            setattr(resume, key, value)
        db.commit()
        db.refresh(resume)
    return resume

def delete_resume(db: Session, resume_id: int) -> bool:
    """Delete a resume."""
    resume = get_resume(db, resume_id)
    if resume:
        db.delete(resume)
        db.commit()
        return True
    return False

def get_job(db: Session, job_id: int) -> Optional[Job]:
    """Get a job by ID."""
    return db.query(Job).filter(Job.id == job_id).first()

def get_jobs(db: Session, skip: int = 0, limit: int = 100) -> List[Job]:
    """Get jobs with pagination."""
    return db.query(Job).offset(skip).limit(limit).all()

def create_job(db: Session, job_data: dict) -> Job:
    """Create a new job."""
    job = Job(**job_data)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

def get_user(db: Session, user_id: int) -> Optional[User]:
    """Get a user by ID."""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get a user by email."""
    return db.query(User).filter(User.email == email).first() 