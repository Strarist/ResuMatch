from sqlalchemy.ext.asyncio import AsyncSession
from app.models.strategic_memory import PropagationEvent

class PropagationEngine:
    @staticmethod
    async def compute_propagation(db: AsyncSession, trigger_id: str, downstream_impact_base: float):
        # Simulate computing affected downstream nodes based on graph edge weights
        affected = ["rec_1", "market_1"]
        confidence_transfer = downstream_impact_base * 0.8

        event = PropagationEvent(
            trigger_event_id=trigger_id,
            affected_systems=affected,
            confidence_transfer=confidence_transfer
        )
        db.add(event)
        await db.commit()
        return event

    @staticmethod
    def get_live_propagation_feed():
        return [
            {"source": "Execution Stabilization", "target": "Recruiter Trust", "impact": "Propagated into trust systems"},
            {"source": "Portfolio Proofs", "target": "Market Alignment", "impact": "Confidence increased"}
        ]
