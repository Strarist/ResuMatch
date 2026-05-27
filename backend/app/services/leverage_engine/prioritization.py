from sqlalchemy.ext.asyncio import AsyncSession
from app.models.strategic_memory import LeverageDecision

class LeverageEngine:
    @staticmethod
    async def compute_highest_leverage_action(db: AsyncSession, user_id: str):
        decision = LeverageDecision(
            user_id=user_id,
            recommendation="Stabilize execution consistency to unlock compensation trajectory acceleration.",
            expected_impact=3.2,
            confidence=0.91,
            propagation_estimate={"nodes_unblocked": 4, "velocity_multiplier": 1.5},
            timeline_effect="Immediate downstream release"
        )
        db.add(decision)
        await db.commit()
        return decision

    @staticmethod
    def get_current_leverage():
        return {
            "action": "Improve TypeScript Proof Quality",
            "impact": "3.2x larger recruiter confidence gains than continuing roadmap completion.",
            "confidence": 0.89,
            "bottleneck": "Execution Consistency"
        }
