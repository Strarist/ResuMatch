from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.resume import Resume
from app.models.user import User
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
from app.services.resume_parser import ResumeParser


class ResumeService:
    """Service for resume operations."""
    
    def __init__(self, db: Session, cache_manager: Any = None, education_matcher: Any = None, role_matcher: Any = None, resume_matcher: Any = None):
        self.db = db
        self.cache_manager = cache_manager
        self.education_matcher = education_matcher
        self.role_matcher = role_matcher
        self.resume_matcher = resume_matcher
        self.parser = ResumeParser()

    def create_resume(self, resume_data: ResumeCreate, user_id: int) -> Resume:
        """Create a new resume"""
        resume = Resume(
            user_id=user_id,
            title=resume_data.title,
            content=resume_data.content,
            skills=resume_data.skills,
            experience=resume_data.experience,
            education=resume_data.education,
            file_path=resume_data.file_path
        )
        self.db.add(resume)
        self.db.commit()
        self.db.refresh(resume)
        return resume

    def get_user_resumes(self, user_id: int) -> List[Resume]:
        """Get all resumes for a user"""
        return self.db.query(Resume).filter(Resume.user_id == user_id).all()

    def get_resume(self, resume_id: int, user_id: int) -> Optional[Resume]:
        """Get a specific resume by ID"""
        return self.db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == user_id
        ).first()

    def get_resume_by_id(self, resume_id: int) -> Resume:
        """Get a resume by ID without user check"""
        resume = self.db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise ValueError(f"Resume with ID {resume_id} not found")
        return resume

    def update_resume(self, resume_id: int, user_id: int, resume_data: ResumeUpdate) -> Optional[Resume]:
        """Update a resume"""
        resume = self.get_resume(resume_id, user_id)
        if not resume:
            return None
        
        # Update fields
        for field, value in resume_data.dict(exclude_unset=True).items():
            setattr(resume, field, value)
        
        self.db.commit()
        self.db.refresh(resume)
        return resume

    def delete_resume(self, resume_id: int, user_id: int) -> bool:
        """Delete a resume"""
        resume = self.get_resume(resume_id, user_id)
        if not resume:
            return False
        
        # Delete file if it exists
        if resume.file_path and os.path.exists(resume.file_path):
            try:
                os.remove(resume.file_path)
            except OSError:
                pass  # File might be locked or already deleted
        
        self.db.delete(resume)
        self.db.commit()
        return True

    def analyze_resume(self, resume_id: int, user_id: int) -> Dict[str, Any]:
        """Analyze a resume and extract structured data"""
        resume = self.get_resume(resume_id, user_id)
        if not resume:
            raise ValueError(f"Resume with ID {resume_id} not found")
        
        if not resume.file_path:
            raise ValueError("Resume file not found")
        
        # For now, return basic analysis
        # In a real implementation, this would call the resume parser
        analysis_result = {
            'skills': resume.skills.split(',') if resume.skills else [],
            'experience': resume.experience,
            'education': resume.education.split(',') if resume.education else []
        }
        
        return {
            'resume_id': resume_id,
            'analysis': analysis_result,
            'status': 'completed'
        }

    def search_resumes(self, user_id: int, query: str) -> List[Resume]:
        """Search resumes by content"""
        return self.db.query(Resume).filter(
            Resume.user_id == user_id,
            Resume.content.contains(query)
        ).all()

    def get_resume_stats(self, user_id: int) -> Dict[str, Any]:
        """Get resume statistics for a user"""
        resumes = self.get_user_resumes(user_id)
        
        total_resumes = len(resumes)
        total_skills = set()
        total_experience_years = 0
        
        for resume in resumes:
            if resume.skills:
                skills = resume.skills.split(',') if resume.skills else []
                total_skills.update(skills)
            
            # Extract experience years (simplified)
            if resume.experience:
                # This is a simplified extraction - in real app, use proper parsing
                experience_text = str(resume.experience).lower()
                if 'years' in experience_text:
                    # Extract number before "years"
                    import re
                    match = re.search(r'(\d+)\s*years?', experience_text)
                    if match:
                        total_experience_years += int(match.group(1))
        
        return {
            'total_resumes': total_resumes,
            'unique_skills': len(total_skills),
            'total_experience_years': total_experience_years,
            'average_experience': total_experience_years / total_resumes if total_resumes > 0 else 0
        }

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