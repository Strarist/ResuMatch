"""Career trajectory persistence models."""

import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, JSON, String, func

from app.models.base import Base


class CareerTrajectorySnapshot(Base):
    __tablename__ = "career_trajectory_snapshots"
    __table_args__ = (
        Index("ix_trajectory_user", "user_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dominant_path = Column(String, nullable=False)
    secondary_paths = Column(JSON, default=list)
    readiness_scores = Column(JSON, default=dict)
    specializations = Column(JSON, default=dict)
    adjacent_roles = Column(JSON, default=list)
    competitiveness_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    drift_detected = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class TrajectoryEvent(Base):
    __tablename__ = "trajectory_events"
    __table_args__ = (
        Index("ix_trajectory_events_user_time", "user_id", "created_at"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String, nullable=False)
    structured_payload = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
