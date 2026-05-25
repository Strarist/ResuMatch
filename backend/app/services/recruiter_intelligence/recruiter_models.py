"""Recruiter intelligence persistence models."""

import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.models import Base


class RecruiterIntelligenceSnapshot(Base):
    __tablename__ = "recruiter_intelligence_snapshots"
    __table_args__ = (
        Index("ix_recruiter_intel_user", "user_id"),
        Index("ix_recruiter_intel_analysis", "analysis_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    analysis_id = Column(UUID(as_uuid=True), nullable=False)
    intelligence_summary = Column(JSONB, default=dict)
    strength_signals = Column(JSONB, default=list)
    risk_signals = Column(JSONB, default=list)
    reasoning_traces = Column(JSONB, default=list)
    confidence_snapshot = Column(JSONB, default=dict)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ReasoningEvent(Base):
    __tablename__ = "reasoning_events"
    __table_args__ = (
        Index("ix_reasoning_user_time", "user_id", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    analysis_id = Column(UUID(as_uuid=True), nullable=False)
    reasoning_type = Column(String, nullable=False)
    evidence_chain = Column(JSONB, nullable=False)
    confidence_score = Column(Float, nullable=False)
    reasoning_snapshot = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
