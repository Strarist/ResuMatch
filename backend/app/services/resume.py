from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.resume import Resume
from app.schemas.resume import ResumeCreate, ResumeUpdate, ResumeInDBBase
from app.core.security import get_password_hash
from app.core.logging import logger
import uuid
import os
from pathlib import Path
from uuid import UUID
from datetime import datetime
from app.core.cache_manager import CacheManager
from app.services.education_matcher import EducationMatcher
from app.services.role_matcher import RoleMatcher
from app.services.resume_matcher import ResumeMatcher


class ResumeService:
    """Service for resume operations."""
    
    def __init__(self, db: Any = None, cache_manager: Any = None, education_matcher: Any = None, role_matcher: Any = None, resume_matcher: Any = None):
        self.db = db
        self.cache_manager = cache_manager
        self.education_matcher = education_matcher
        self.role_matcher = role_matcher
        self.resume_matcher = resume_matcher

    async def create_resume(self, resume: ResumeCreate, user_id: int) -> Resume:
        """Create a new resume"""
        try:
            db_resume = Resume(
                user_id=user_id,
                title=resume.title,
                content=resume.content,
                skills=resume.skills,
                experience=resume.experience,
                education=resume.education,
                file_path=resume.file_path
            )
            self.db.add(db_resume)
            self.db.commit()
            self.db.refresh(db_resume)
            return db_resume
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating resume: {str(e)}")
            raise HTTPException(status_code=400, detail="Could not create resume")

    async def get_resume(self, resume_id: int, user_id: int) -> Optional[Resume]:
        """Get a resume by ID"""
        resume = self.db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == user_id
        ).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        return resume

    async def get_user_resumes(self, user_id: int) -> List[Resume]:
        """Get all resumes for a user"""
        return self.db.query(Resume).filter(Resume.user_id == user_id).all()

    async def update_resume(self, resume_id: int, resume: ResumeUpdate, user_id: int) -> Resume:
        """Update a resume"""
        db_resume = await self.get_resume(resume_id, user_id)
        try:
            for field, value in resume.dict(exclude_unset=True).items():
                setattr(db_resume, field, value)
            self.db.commit()
            self.db.refresh(db_resume)
            return db_resume
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating resume: {str(e)}")
            raise HTTPException(status_code=400, detail="Could not update resume")

    async def delete_resume(self, resume_id: int, user_id: int) -> bool:
        """Delete a resume"""
        db_resume = await self.get_resume(resume_id, user_id)
        try:
            # Delete associated file if exists
            if db_resume.file_path:
                file_path = Path(db_resume.file_path)
                if file_path.exists():
                    os.remove(file_path)
            
            self.db.delete(db_resume)
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting resume: {str(e)}")
            raise HTTPException(status_code=400, detail="Could not delete resume")

    async def upload_resume_file(self, file: UploadFile, user_id: int) -> str:
        """Upload a resume file and return the file path"""
        try:
            # Create uploads directory if it doesn't exist
            upload_dir = Path("uploads/resumes")
            upload_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate unique filename
            file_extension = file.filename.split(".")[-1]
            filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = upload_dir / filename
            
            # Save file
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            return str(file_path)
        except Exception as e:
            logger.error(f"Error uploading resume file: {str(e)}")
            raise HTTPException(status_code=400, detail="Could not upload resume file")

    async def match_resume(
        self,
        resume_id: UUID,
        job_id: UUID
    ) -> Dict[str, Any]:
        """Match a resume against a job."""
        # Implementation here
        pass 

def calculate_match_score(resume, job):
    # TODO: Implement actual match score logic
    return 0.0 