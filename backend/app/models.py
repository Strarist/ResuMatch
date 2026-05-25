"""SQLAlchemy ORM models. All entities use UUID primary keys."""

import enum
import uuid

from sqlalchemy import Column, Enum, Float, ForeignKey, Index, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    provider = Column(String, nullable=False)
    profile_img = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan", lazy="selectin")


class Resume(Base):
    __tablename__ = "resumes"
    __table_args__ = (
        Index("ix_resumes_user_id_uploaded", "user_id", "uploaded_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    skills = Column(ARRAY(Text))
    raw_text = Column(Text)
    parsed_data = Column(JSONB)
    parse_status = Column(String, default="pending", index=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    user = relationship("User", back_populates="resumes")
    matches = relationship("Match", back_populates="resume", cascade="all, delete-orphan", lazy="selectin")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    requirements = Column(JSONB, nullable=False)

    matches = relationship("Match", back_populates="job", cascade="all, delete-orphan")


class Match(Base):
    __tablename__ = "matches"
    __table_args__ = (
        Index("ix_matches_resume_id_score", "resume_id", "score"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resume = relationship("Resume", back_populates="matches")
    job = relationship("Job", back_populates="matches", lazy="selectin")


class SanitizationStatus(enum.Enum):
    success = "success"
    failure = "failure"


class FileSanitizationAudit(Base):
    __tablename__ = "file_sanitization_audit"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    filename = Column(String, nullable=False)
    status = Column(Enum(SanitizationStatus), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    reason = Column(Text, nullable=True)
    session_id = Column(String, nullable=True)
