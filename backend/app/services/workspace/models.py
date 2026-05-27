"""Workspace persistence models — sessions, messages, recommendation actions."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, JSON, String, Text, func

from app.models.base import Base


class WorkspaceSession(Base):
    __tablename__ = "workspace_sessions"
    __table_args__ = (Index("ix_ws_sessions_user", "user_id"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, default="New Session")
    session_type = Column(String, default="copilot")  # copilot, project, strategy
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class WorkspaceMessage(Base):
    __tablename__ = "workspace_messages"
    __table_args__ = (Index("ix_ws_messages_session", "session_id", "created_at"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("workspace_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    intelligence_context = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RecommendationAction(Base):
    __tablename__ = "recommendation_actions"
    __table_args__ = (Index("ix_rec_actions_user", "user_id"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recommendation_type = Column(String, nullable=False)
    recommendation_title = Column(String, nullable=False)
    action = Column(String, nullable=False)  # accept, defer, dismiss, add_to_roadmap
    created_at = Column(DateTime(timezone=True), server_default=func.now())
