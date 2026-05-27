"""Logic to generate and retrieve CareerMemorySnapshots."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.memory import CareerMemorySnapshot

async def create_snapshot(
    session: AsyncSession,
    user_id: str,
    trigger_event: str,
    metrics: dict,
    specialization: str | None = None,
    roadmap_state: dict | None = None,
    portfolio_maturity: str | None = None
) -> CareerMemorySnapshot:
    """Creates a new CareerMemorySnapshot to record the user's state."""
    snapshot = CareerMemorySnapshot(
        user_id=user_id,
        trigger_event=trigger_event,
        match_score=metrics.get("match_score", 0.0),
        career_velocity=metrics.get("career_velocity", 0.0),
        market_fit=metrics.get("market_fit", 0.0),
        recruiter_confidence=metrics.get("recruiter_confidence", 0.0),
        competitiveness=metrics.get("competitiveness", 0.0),
        specialization=specialization,
        roadmap_state=roadmap_state,
        portfolio_maturity=portfolio_maturity
    )
    session.add(snapshot)
    await session.commit()
    return snapshot

async def get_latest_snapshots(session: AsyncSession, user_id: str, limit: int = 10) -> list[CareerMemorySnapshot]:
    """Retrieves the most recent memory snapshots for a user."""
    stmt = (
        select(CareerMemorySnapshot)
        .where(CareerMemorySnapshot.user_id == user_id)
        .order_by(desc(CareerMemorySnapshot.created_at))
        .limit(limit)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())
