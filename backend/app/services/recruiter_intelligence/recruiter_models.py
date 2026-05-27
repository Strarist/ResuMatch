"""Recruiter intelligence persistence models."""

import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, JSON, String, func

from app.models.base import Base


class RecruiterIntelligenceSnapshot(Base):
    __tablename__ = "recruiter_intelligence_snapshots"
    __table_args__ = (
        Index("ix_recruiter_intel_user", "user_id"),
        Index("ix_recruiter_intel_analysis", "analysis_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    analysis_id = Column(String(36), nullable=False)
    intelligence_summary = Column(JSON, default=dict)
    strength_signals = Column(JSON, default=list)
    risk_signals = Column(JSON, default=list)
    reasoning_traces = Column(JSON, default=list)
    confidence_snapshot = Column(JSON, default=dict)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ReasoningEvent(Base):
    __tablename__ = "reasoning_events"
    __table_args__ = (
        Index("ix_reasoning_user_time", "user_id", "created_at"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    analysis_id = Column(String(36), nullable=False)
    reasoning_type = Column(String, nullable=False)
    evidence_chain = Column(JSON, nullable=False)
    confidence_score = Column(Float, nullable=False)
    reasoning_snapshot = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
