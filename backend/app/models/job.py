from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, ARRAY, Float, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    description = Column(String, nullable=False)
    requirements = Column(ARRAY(String), nullable=True, default=list)
    location = Column(String, nullable=False)
    type = Column(String, nullable=False)  # full-time, part-time, contract, remote
    salary = Column(JSON, nullable=True)  # {min: int, max: int, currency: str}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="jobs")
    matches = relationship("JobMatch", back_populates="job")


class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    score = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    job = relationship("Job", back_populates="matches")
    resume = relationship("Resume", back_populates="matches") 