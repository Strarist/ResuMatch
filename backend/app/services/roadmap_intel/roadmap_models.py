"""Adaptive roadmap persistence models."""

import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, func

from app.models.base import Base


class RoadmapState(Base):
    __tablename__ = "roadmap_states"
    __table_args__ = (
        Index("ix_roadmap_user_role", "user_id", "target_role"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_role = Column(String, nullable=False)
    current_stage = Column(String, default="active")
    roadmap_version = Column(Integer, default=1)
    roadmap_snapshot = Column(JSON, default=dict)
    completed_nodes = Column(JSON, default=list)
    deferred_nodes = Column(JSON, default=list)
    active_focus_areas = Column(JSON, default=list)
    confidence_model = Column(JSON, default=dict)
    learning_velocity = Column(Float, default=0.0)
    last_generated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class RoadmapEvent(Base):
    __tablename__ = "roadmap_events"
    __table_args__ = (
        Index("ix_roadmap_events_user_time", "user_id", "created_at"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    roadmap_state_id = Column(String(36), ForeignKey("roadmap_states.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String, nullable=False)
    structured_payload = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
