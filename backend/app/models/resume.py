from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, ARRAY, Float, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base
import uuid


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=True)
    skills = Column(ARRAY(String), nullable=True, default=list)
    experience = Column(JSON, nullable=True)
    education = Column(ARRAY(String), nullable=True, default=list)
    file_path = Column(String, nullable=True)
    match_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="resumes")
    matches = relationship("JobMatch", back_populates="resume") 