from sqlalchemy import Column, Integer, String, Text, JSON, Float, ForeignKey, Table, DateTime, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import declarative_base, relationship
import enum
from sqlalchemy import Enum
from uuid import uuid4

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    provider = Column(String, nullable=False)
    profile_img = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)  # For email/password auth
    resumes = relationship("Resume", back_populates="user")

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    skills = Column(ARRAY(Text), index=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="resumes")
    matches = relationship("Match", back_populates="resume")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    requirements = Column(JSONB, nullable=False)
    matches = relationship("Match", back_populates="job")

class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    score = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resume = relationship("Resume", back_populates="matches")
    job = relationship("Job", back_populates="matches")

class SanitizationStatus(enum.Enum):
    success = "success"
    failure = "failure"

class FileSanitizationAudit(Base):
    __tablename__ = "file_sanitization_audit"
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, nullable=True)
    filename = Column(String, nullable=False)
    status = Column(Enum(SanitizationStatus), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    reason = Column(Text, nullable=True)
    session_id = Column(String, nullable=True) 