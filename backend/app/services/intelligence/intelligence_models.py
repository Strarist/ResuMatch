"""Intelligence persistence models."""

import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.models import Base


class UserSkillProfile(Base):
    __tablename__ = "user_skill_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", "normalized_skill", name="uq_user_skill"),
        Index("ix_skill_profile_user", "user_id"),
        Index("ix_skill_profile_confidence", "user_id", "confidence_score"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    normalized_skill = Column(String, nullable=False)
    confidence_score = Column(Float, default=0.0)
    proficiency_estimate = Column(Float, default=0.0)
    occurrence_count = Column(Integer, default=1)
    evidence_sources = Column(JSONB, default=list)
    first_seen_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UserCareerProfile(Base):
    __tablename__ = "user_career_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    inferred_seniority = Column(String, default="mid")
    preferred_roles = Column(JSONB, default=list)
    preferred_domains = Column(JSONB, default=list)
    strongest_skill_clusters = Column(JSONB, default=list)
    growth_velocity = Column(Float, default=0.0)
    resume_version_count = Column(Integer, default=0)
    confidence_snapshot = Column(JSONB, default=dict)
    last_analysis_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AnalysisMemoryEvent(Base):
    __tablename__ = "analysis_memory_events"
    __table_args__ = (
        Index("ix_memory_events_user_time", "user_id", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    analysis_id = Column(UUID(as_uuid=True), nullable=False)
    event_type = Column(String, nullable=False)
    structured_payload = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
