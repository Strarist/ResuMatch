"""Automation Engine — scheduled intelligence cycles and opportunity monitoring.

All automation is deterministic, explainable, interruptible, and auditable.
"""

from __future__ import annotations
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Index, Integer, JSON, String, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base


class AutomationCycle(Base):
    __tablename__ = "automation_cycles"
    __table_args__ = (Index("ix_auto_cycles_user", "user_id", "created_at"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cycle_type = Column(String, nullable=False)
    user_id = Column(String(36), nullable=False, index=True)
    status = Column(String, default="pending")  # pending, running, completed, failed
    triggered_by = Column(String, default="scheduled")
    duration_ms = Column(Float, nullable=True)
    changed_domains = Column(JSON, default=list)
    events_generated = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)


async def run_automation_cycle(
    db: AsyncSession,
    user_id: str,
    cycle_type: str,
    triggered_by: str = "scheduled",
) -> dict:
    """Execute an automation cycle. Returns summary of changes."""
    from app.services.intelligence.orchestrator import run_intelligence_cycle
    from app.services.notifications import create_notification

    start = datetime.now(timezone.utc)
    cycle = AutomationCycle(user_id=user_id, cycle_type=cycle_type, triggered_by=triggered_by, status="running")
    db.add(cycle)
    await db.flush()

    changed = []
    events = 0

    try:
        # Run intelligence cycle
        intel = await run_intelligence_cycle(db, user_id)
        summary = intel["summary"]
        recommendations = intel["recommendations"]

        # Detect notable changes
        if summary.get("drift_detected"):
            changed.append("trajectory")
            await create_notification(db, user_id, "trajectory_shift", "Career trajectory shifted", summary.get("drift_details", ""), "high")
            events += 1

        # Check opportunity unlocks
        for adj in summary.get("adjacent_roles", []):
            if adj.get("readiness", 0) >= 0.7:
                changed.append("opportunity")
                await create_notification(db, user_id, "opportunity_unlocked", f"Near-ready for {adj['role']}", f"{int(adj['readiness']*100)}% readiness achieved", "strategic")
                events += 1
                break

        # Check stagnation
        if cycle_type in ("daily_light_refresh", "weekly_full_refresh"):
            from app.services.execution import compute_execution_profile
            from app.services.roadmap_intel import RoadmapRepository
            roadmap_repo = RoadmapRepository(db)
            roadmap = await roadmap_repo.get_active(user_id)
            if roadmap:
                exec_profile = compute_execution_profile(
                    completed_nodes=roadmap.completed_nodes or [], deferred_nodes=roadmap.deferred_nodes or [],
                    recommendation_actions=[], operational_events=[], roadmap_version=roadmap.roadmap_version,
                    growth_velocity=summary.get("competitiveness", 0), last_upload_at=None, last_activity_at=None,
                )
                if exec_profile.get("stagnation_risk") == "high":
                    changed.append("stagnation")
                    await create_notification(db, user_id, "stagnation_warning", "Stagnation risk detected", "Consider simplifying your roadmap or completing one milestone.", "high")
                    events += 1

        # Complete cycle
        end = datetime.now(timezone.utc)
        cycle.status = "completed"
        cycle.completed_at = end
        cycle.duration_ms = (end - start).total_seconds() * 1000
        cycle.changed_domains = changed
        cycle.events_generated = events
        await db.flush()

    except Exception as e:
        cycle.status = "failed"
        await db.flush()
        raise

    return {
        "cycle_id": cycle.id,
        "cycle_type": cycle_type,
        "status": "completed",
        "duration_ms": cycle.duration_ms,
        "changed_domains": changed,
        "events_generated": events,
    }


async def get_automation_history(db: AsyncSession, user_id: str, limit: int = 10) -> list[AutomationCycle]:
    result = await db.execute(
        select(AutomationCycle).where(AutomationCycle.user_id == user_id).order_by(AutomationCycle.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())
