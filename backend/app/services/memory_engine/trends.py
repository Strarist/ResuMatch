"""Logic to detect behavioral changes over time from memory snapshots."""

from app.models.memory import CareerMemorySnapshot, BehavioralPattern
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import datetime

async def analyze_trends(session: AsyncSession, user_id: str) -> list[BehavioralPattern]:
    """Analyze the user's historical snapshots to detect behavioral patterns."""

    # Fetch recent snapshots
    stmt = (
        select(CareerMemorySnapshot)
        .where(CareerMemorySnapshot.user_id == user_id)
        .order_by(desc(CareerMemorySnapshot.created_at))
        .limit(30)
    )
    result = await session.execute(stmt)
    snapshots = list(result.scalars().all())

    if len(snapshots) < 3:
        return [] # Not enough data for trend analysis

    patterns = []

    # Example trend analysis: Recruiter Confidence Growth
    first_conf = snapshots[-1].recruiter_confidence
    latest_conf = snapshots[0].recruiter_confidence

    if latest_conf > first_conf + 10:
        patterns.append(
            BehavioralPattern(
                user_id=user_id,
                pattern_type="confidence_growth",
                severity=0.8,
                metadata_json={"growth": latest_conf - first_conf}
            )
        )
    elif latest_conf < first_conf - 5:
        patterns.append(
            BehavioralPattern(
                user_id=user_id,
                pattern_type="stagnation",
                severity=0.6,
                metadata_json={"drop": first_conf - latest_conf}
            )
        )

    # Example: Specialization Volatility (changing specializations rapidly)
    specializations = [s.specialization for s in snapshots if s.specialization]
    if len(set(specializations)) > 3:
        patterns.append(
            BehavioralPattern(
                user_id=user_id,
                pattern_type="specialization_volatility",
                severity=0.7,
                metadata_json={"unique_specializations": len(set(specializations))}
            )
        )

    for p in patterns:
        session.add(p)

    if patterns:
        await session.commit()

    return patterns
