import json
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.strategic_memory import StrategicMemoryEvent, MemoryCluster

class StrategicMemoryService:
    @staticmethod
    async def record_event(db: AsyncSession, user_id: str, event_type: str, domain: str, signal_strength: float, strategic_impact: float, confidence: float, source: str, before_state: dict = None, after_state: dict = None):
        event = StrategicMemoryEvent(
            user_id=user_id,
            event_type=event_type,
            domain=domain,
            signal_strength=signal_strength,
            strategic_impact=strategic_impact,
            confidence=confidence,
            source=source,
            before_state=before_state,
            after_state=after_state
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event

    @staticmethod
    async def process_memory_clusters(db: AsyncSession, user_id: str):
        # Background task simulation: aggregate recent events to detect momentum cycles
        cluster = MemoryCluster(
            user_id=user_id,
            pattern_type="consistent_execution",
            description="Detected recurring execution behavior in Portfolio Domain",
            confidence=0.85,
            supporting_events=[]
        )
        db.add(cluster)
        await db.commit()
        return cluster
