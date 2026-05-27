"""Operational events + intelligence consistency validation."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Index, JSON, String, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.base import Base


class OperationalEvent(Base):
    __tablename__ = "operational_events"
    __table_args__ = (Index("ix_op_events_type_time", "event_type", "created_at"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String, nullable=False)
    source = Column(String, nullable=False)
    user_id = Column(String(36), nullable=True, index=True)
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


async def emit_event(db: AsyncSession, event_type: str, source: str, user_id: str | None = None, payload: dict | None = None) -> None:
    """Emit an operational event."""
    db.add(OperationalEvent(event_type=event_type, source=source, user_id=user_id, payload=payload or {}))
    await db.flush()


async def get_events(db: AsyncSession, user_id: str, limit: int = 30) -> list[OperationalEvent]:
    result = await db.execute(
        select(OperationalEvent).where(OperationalEvent.user_id == user_id).order_by(OperationalEvent.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())


# === Intelligence Consistency Validation ===

def validate_intelligence_consistency(trajectory: dict, roadmap_state, market: dict, recommendations: list[dict]) -> list[dict]:
    """Check for contradictions across intelligence systems. Returns list of warnings."""
    warnings: list[dict] = []

    dominant = trajectory.get("dominant_path", "")
    focus_areas = (roadmap_state.active_focus_areas if roadmap_state else []) or []
    specs = trajectory.get("specializations", {})

    # 1. Roadmap focus contradicts trajectory
    if roadmap_state and dominant:
        dominant_lower = dominant.lower()
        # Check if focus areas align with dominant path
        misaligned = [f for f in focus_areas if f.lower() not in dominant_lower and dominant_lower not in f.lower()]
        if len(misaligned) > 2:
            warnings.append({"type": "roadmap_trajectory_mismatch", "detail": f"Roadmap focus ({', '.join(misaligned)}) may not align with {dominant} trajectory"})

    # 2. Duplicate roadmap nodes
    if roadmap_state and roadmap_state.roadmap_snapshot:
        milestones = roadmap_state.roadmap_snapshot.get("milestones", [])
        skills = [m.get("skill", "").lower() for m in milestones]
        dupes = [s for s in set(skills) if skills.count(s) > 1]
        if dupes:
            warnings.append({"type": "duplicate_roadmap_nodes", "detail": f"Duplicate nodes: {', '.join(dupes)}"})

    # 3. Stale recommendations (recommending skills user already has)
    user_specs_skills = set()
    for spec_data in specs.values():
        user_specs_skills.update(s.lower() for s in spec_data.get("skills", []))
    for rec in recommendations:
        for domain in rec.get("related_domains", []):
            if domain.lower() in user_specs_skills and rec["type"] == "next_skill":
                warnings.append({"type": "stale_recommendation", "detail": f"Recommending '{rec['title']}' but skill may already be known"})
                break

    return warnings
