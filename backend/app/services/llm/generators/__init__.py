import logging
from typing import List, Dict, Any
from app.services.llm.provider import llm_service
from app.services.llm.prompts import ROADMAP_GENERATION_SYSTEM, OPPORTUNITY_MATCHING_SYSTEM
from app.services.llm.schemas import RoadmapGenerationSchema, OpportunityMatchingSchema

logger = logging.getLogger(__name__)

async def generate_adaptive_roadmap(target_role: str, validated_skills: List[str], gaps: List[str]) -> List[Dict[str, Any]]:
    """Generate high ROI roadmap milestones via OpenRouter based on target role and skills gaps."""
    fallback_data = {
        "milestones": [
            {
                "skill": gap,
                "priority": "high",
                "effort_weeks": 4,
                "impact_estimate": 85,
                "reason": f"Required gap for target role {target_role}",
                "dependencies": [],
                "completionConfidence": 80,
                "projectedImpact": f"Bridges the primary skill deficit and validates readiness.",
                "strategicRationale": f"Flagged by screening systems as a critical trajectory blocker."
            }
            for gap in gaps[:5]
        ]
    }

    # Format inputs
    val_str = ", ".join(validated_skills) or "None"
    gaps_str = ", ".join(gaps) or "None"

    messages = [
        {
            "role": "user",
            "content": ROADMAP_GENERATION_SYSTEM.format(
                target_role=target_role,
                validated_skills=val_str,
                gaps=gaps_str
            )
        }
    ]

    logger.info(f"Generating adaptive roadmap via OpenRouter LLM for target role: {target_role}")
    result_json = await llm_service.generate_json(
        messages=messages,
        schema_fallback=fallback_data,
        temperature=0.2
    )

    try:
        validated = RoadmapGenerationSchema.model_validate(result_json)
        return [m.model_dump() for m in validated.milestones]
    except Exception as e:
        logger.error(f"Pydantic validation failed for roadmap generation: {e}. Returning fallback roadmap.")
        return result_json.get("milestones", fallback_data["milestones"])


async def generate_opportunity_matches(validated_skills: List[str], gaps: List[str], specialization: str) -> List[Dict[str, Any]]:
    """Generate explainable opportunity matches via OpenRouter based on candidate specializations and gaps."""
    fallback_data = {
        "matches": [
            {
                "title": f"Senior {specialization} Developer",
                "company": "Enterprise Target Co.",
                "alignmentScore": 0.85,
                "confidence": 0.82,
                "urgency": "medium",
                "type": "Full-time / Remote",
                "missingRequirements": gaps[:2],
                "proofGaps": ["deployed project demonstrating skills"],
                "compensation": "$140k - $170k",
                "recruiterPressure": "medium",
                "hiringWindow": "Closes in 6 days",
                "stackCompatibility": specialization,
                "alignmentReasoning": f"Matches your dominant specialization in {specialization}. Acquiring remaining skill gaps elevates callback probabilities."
            }
        ]
    }

    val_str = ", ".join(validated_skills) or "None"
    gaps_str = ", ".join(gaps) or "None"

    messages = [
        {
            "role": "user",
            "content": OPPORTUNITY_MATCHING_SYSTEM.format(
                validated_skills=val_str,
                gaps=gaps_str,
                specialization=specialization
            )
        }
    ]

    logger.info(f"Generating explainable opportunity matches via OpenRouter LLM for specialization: {specialization}")
    result_json = await llm_service.generate_json(
        messages=messages,
        schema_fallback=fallback_data,
        temperature=0.2
    )

    try:
        validated = OpportunityMatchingSchema.model_validate(result_json)
        return [m.model_dump() for m in validated.matches]
    except Exception as e:
        logger.error(f"Pydantic validation failed for opportunity matches: {e}. Returning fallback matches.")
        return result_json.get("matches", fallback_data["matches"])
