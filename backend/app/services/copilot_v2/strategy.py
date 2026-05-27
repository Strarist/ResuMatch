"""Logic and prompt injection for Adaptive Copilot interactions."""

from app.services.memory_engine.snapshot import get_latest_snapshots
from app.services.memory_engine.trends import analyze_trends
from sqlalchemy.ext.asyncio import AsyncSession
import json

async def generate_adaptive_prompt(session: AsyncSession, user_id: str, base_prompt: str) -> str:
    """Inject longitudinal history and behavioral patterns into the Copilot prompt."""
    snapshots = await get_latest_snapshots(session, user_id, limit=5)
    patterns = await analyze_trends(session, user_id)

    context = "=== LONGITUDINAL CAREER MEMORY ===\n"
    if snapshots:
        latest = snapshots[0]
        context += f"Current State: Velocity={latest.career_velocity}, MarketFit={latest.market_fit}, RecruiterConfidence={latest.recruiter_confidence}\n"

    if patterns:
        context += "Detected Behavioral Patterns over 90 days:\n"
        for p in patterns:
            context += f"- {p.pattern_type} (severity: {p.severity})\n"

    context += "\n=== INSTRUCTIONS ===\n"
    context += "Use the above strategic memory to inform your response. Do not act like a generic chatbot. Be precise, analytical, and reference their historical momentum if relevant.\n"
    context += f"USER QUERY:\n{base_prompt}"

    return context

def generate_reflection_response(patterns: list) -> str:
    """Generate high-signal reflections based on patterns."""
    if not patterns:
        return "Your execution has been stable. No major deviations detected."

    responses = []
    for p in patterns:
        if p.pattern_type == "confidence_growth":
            responses.append(f"Your consistency improved significantly, increasing recruiter confidence by {p.metadata_json.get('growth', 0)} points.")
        elif p.pattern_type == "specialization_volatility":
            responses.append(f"We've detected specialization fragmentation across {p.metadata_json.get('unique_specializations', 0)} domains. We recommend consolidating your stack.")

    return "\n".join(responses)
