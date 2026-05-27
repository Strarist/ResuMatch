"""Growth Systems — digest, reactivation, health scoring, evolution timeline.

Professional retention infrastructure. No vanity gamification.
"""

from __future__ import annotations
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Index, JSON, String, Float, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base


# === Models ===

class StrategicDigest(Base):
    __tablename__ = "strategic_digests"
    __table_args__ = (Index("ix_digests_user", "user_id", "generated_at"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    digest_type = Column(String, nullable=False)  # weekly, monthly
    summary = Column(String, nullable=True)
    highlights = Column(JSON, default=list)
    opportunities = Column(JSON, default=list)
    risks = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())


class CareerEvolutionEvent(Base):
    __tablename__ = "career_evolution_events"
    __table_args__ = (Index("ix_evolution_user", "user_id", "created_at"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    event_type = Column(String, nullable=False)
    strategic_significance = Column(String, default="medium")
    before_state = Column(String, nullable=True)
    after_state = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# === Digest Engine ===

def generate_weekly_digest(summary: dict, execution: dict, recommendations: list[dict]) -> dict:
    """Generate weekly strategic digest from intelligence state."""
    highlights = []
    if execution.get("momentum_score", 0) >= 0.5:
        highlights.append(f"Momentum at {int(execution['momentum_score']*100)}% — strong execution")
    if summary.get("competitiveness", 0) >= 0.6:
        highlights.append(f"Competitiveness: {int(summary['competitiveness']*100)}%")
    if execution.get("completed_count", 0) > 0:
        highlights.append(f"{execution['completed_count']} roadmap milestones completed")

    opportunities = []
    for adj in summary.get("adjacent_roles", [])[:2]:
        opportunities.append(f"{adj['role']}: {int(adj['readiness']*100)}% ready")

    risks = []
    if execution.get("stagnation_risk") in ("medium", "high"):
        risks.append(f"Stagnation risk: {execution['stagnation_risk']}")

    return {
        "digest_type": "weekly",
        "summary": f"Trajectory: {summary.get('dominant_path', 'Building')} | Style: {execution.get('execution_style', 'developing')}",
        "highlights": highlights,
        "opportunities": opportunities,
        "risks": risks,
        "recommendations": [r["title"] for r in recommendations[:3]],
    }


# === Reactivation Engine ===

def detect_reactivation_need(execution: dict, days_inactive: int) -> dict | None:
    """Detect if user needs reactivation. Returns intervention or None."""
    if days_inactive < 7 and execution.get("stagnation_risk") != "high":
        return None

    if days_inactive >= 30:
        return {"type": "dormant_recovery", "urgency": "high", "message": "Your career intelligence is stale. A quick recompute will refresh your strategic position.", "actions": ["Trigger intelligence refresh", "Review roadmap priorities"]}
    if days_inactive >= 14:
        return {"type": "momentum_recovery", "urgency": "medium", "message": "Your execution momentum is declining. One completed milestone can restart your trajectory.", "actions": ["Complete easiest roadmap item", "Review recommendations"]}
    if execution.get("stagnation_risk") == "high":
        return {"type": "stagnation_intervention", "urgency": "high", "message": "Multiple stagnation signals detected. Consider simplifying your roadmap.", "actions": ["Simplify roadmap", "Narrow specialization focus"]}
    return None


# === Health Scoring ===

def compute_platform_health(execution: dict, recruiter_profile: dict, trajectory: dict) -> dict:
    """Compute user's platform health score."""
    momentum = execution.get("momentum_score", 0)
    consistency = execution.get("execution_consistency", 0)
    hiring = recruiter_profile.get("hiring_confidence", 0)
    competitiveness = trajectory.get("competitiveness_score", 0)
    stagnation = execution.get("stagnation_risk", "none")

    engagement = momentum * 0.5 + consistency * 0.5
    execution_health = momentum * 0.6 + (1.0 if stagnation == "none" else 0.3) * 0.4
    recruiter_health = hiring
    specialization_health = max((s.get("strength", 0) for s in trajectory.get("specializations", {}).values()), default=0)

    composite = engagement * 0.2 + execution_health * 0.25 + recruiter_health * 0.25 + specialization_health * 0.15 + competitiveness * 0.15

    if composite >= 0.8:
        classification = "elite"
    elif composite >= 0.65:
        classification = "accelerating"
    elif composite >= 0.5:
        classification = "strong"
    elif composite >= 0.35:
        classification = "stable"
    elif composite >= 0.2:
        classification = "unstable"
    else:
        classification = "at_risk"

    return {
        "overall_score": round(composite, 3),
        "classification": classification,
        "engagement_health": round(engagement, 3),
        "execution_health": round(execution_health, 3),
        "recruiter_visibility_health": round(recruiter_health, 3),
        "specialization_health": round(specialization_health, 3),
        "momentum_health": round(momentum, 3),
    }


# === Repository ===

async def save_digest(db: AsyncSession, user_id: str, digest_data: dict) -> StrategicDigest:
    digest = StrategicDigest(user_id=user_id, **digest_data)
    db.add(digest)
    await db.flush()
    return digest


async def get_digests(db: AsyncSession, user_id: str, limit: int = 10) -> list[StrategicDigest]:
    result = await db.execute(select(StrategicDigest).where(StrategicDigest.user_id == user_id).order_by(StrategicDigest.generated_at.desc()).limit(limit))
    return list(result.scalars().all())


async def get_evolution_timeline(db: AsyncSession, user_id: str, limit: int = 30) -> list[CareerEvolutionEvent]:
    result = await db.execute(select(CareerEvolutionEvent).where(CareerEvolutionEvent.user_id == user_id).order_by(CareerEvolutionEvent.created_at.desc()).limit(limit))
    return list(result.scalars().all())
