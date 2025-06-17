from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from uuid import UUID
import uuid

class JobMatch(Base):
    __tablename__ = "job_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    match_score = Column(Float, nullable=False)
    skill_match_score = Column(Float, nullable=True)
    experience_match_score = Column(Float, nullable=True)
    education_match_score = Column(Float, nullable=True)
    role_match_score = Column(Float, nullable=True)
    analysis_data = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    resume = relationship("Resume", back_populates="job_matches")
    job = relationship("Job", back_populates="resume_matches") 