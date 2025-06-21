import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class ResumeAnalysis(Base):
    __tablename__ = "resume_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=False)
    match_score = Column(Float, nullable=False)
    missing_skills = Column(JSON, nullable=True)
    suggestions = Column(Text, nullable=True)
    analyzed_at = Column(DateTime, default=datetime.utcnow, nullable=False) 