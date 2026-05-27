"""Engagement Engine — momentum tracking and milestone generation."""

from __future__ import annotations
import uuid

from sqlalchemy import Column, DateTime, Float, Index, JSON, String, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base


class MilestoneEvent(Base):
    __tablename__ = "milestone_events"
    __table_args__ = (Index("ix_milestones_user", "user_id"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    milestone_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    strategic_significance = Column(String, default="medium")
    category = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# Momentum states
MOMENTUM_STATES = ["dormant", "recovering", "stable", "accelerating", "high_performance"]


def compute_momentum_profile(execution_profile: dict, recruiter_profile: dict) -> dict:
    """Compute engagement momentum state."""
    momentum = execution_profile.get("momentum_score", 0)
    consistency = execution_profile.get("execution_consistency", 0)
    style = execution_profile.get("execution_style", "inconsistent")
    days_inactive = execution_profile.get("days_since_activity", 999)

    # Determine state
    if days_inactive > 14 or momentum < 0.1:
        state = "dormant"
    elif style == "recovering" or (momentum < 0.3 and days_inactive < 14):
        state = "recovering"
    elif momentum >= 0.7 and style in ("sprinter", "highly_disciplined"):
        state = "high_performance"
    elif momentum >= 0.5:
        state = "accelerating"
    else:
        state = "stable"

    # Burnout probability
    burnout = 0.0
    if style == "sprinter" and momentum >= 0.8 and days_inactive <= 1:
        burnout = 0.3
    if consistency >= 0.9 and momentum >= 0.9:
        burnout = 0.4

    # Engagement energy (0-1)
    energy = momentum * 0.5 + consistency * 0.3 + (1.0 if days_inactive <= 2 else 0.3) * 0.2

    return {
        "state": state,
        "active_streak": max(0, 7 - days_inactive),
        "consistency_score": round(consistency, 3),
        "execution_energy": round(min(1.0, energy), 3),
        "momentum_trend": "rising" if momentum >= 0.5 else "falling" if momentum < 0.2 else "stable",
        "burnout_probability": round(burnout, 3),
    }


def detect_milestones(
    execution_profile: dict,
    recruiter_profile: dict,
    portfolio_maturity: str,
    trajectory: dict,
) -> list[dict]:
    """Detect newly achieved milestones."""
    milestones = []
    completed = execution_profile.get("completed_count", 0)
    hiring = recruiter_profile.get("hiring_confidence", 0)

    if completed >= 1 and completed <= 2:
        milestones.append({"type": "first_completion", "title": "First roadmap milestone completed", "significance": "medium", "category": "execution"})
    if completed >= 5:
        milestones.append({"type": "execution_streak", "title": "5+ roadmap milestones completed", "significance": "high", "category": "execution"})
    if hiring >= 0.6:
        milestones.append({"type": "recruiter_ready", "title": "Recruiter-ready threshold reached", "significance": "strategic", "category": "recruiter"})
    if portfolio_maturity in ("production_ready", "scalable", "differentiated"):
        milestones.append({"type": "portfolio_maturity", "title": f"Portfolio maturity: {portfolio_maturity.replace('_', ' ')}", "significance": "high", "category": "portfolio"})

    specs = trajectory.get("specializations", {})
    for domain, data in specs.items():
        if data.get("dominant") and data.get("strength", 0) >= 0.7:
            milestones.append({"type": "specialization_mastery", "title": f"{domain.title()} specialization mastery", "significance": "strategic", "category": "specialization"})
            break

    return milestones


async def get_milestones(db: AsyncSession, user_id: str, limit: int = 20) -> list[MilestoneEvent]:
    result = await db.execute(
        select(MilestoneEvent).where(MilestoneEvent.user_id == user_id).order_by(MilestoneEvent.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())
