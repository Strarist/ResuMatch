"""Skill Gap Roadmap Engine.

Transforms missing-skill analysis into sequenced, actionable learning roadmaps.
Combines: skill taxonomy (prerequisites), AI planning (projects/strategy), and
impact estimation (score improvement prediction).
"""

from collections.abc import AsyncGenerator
from dataclasses import dataclass, field

from app.ai import AIMessage, AIStreamChunk
from app.ai.provider_factory import get_ai_provider
from app.ai.skill_taxonomy import get_full_learning_path, get_effort_weeks


@dataclass
class RoadmapMilestone:
    skill: str
    effort_weeks: int
    prerequisites: list[str]
    priority: str  # high | medium | low
    impact_estimate: float  # estimated score improvement (0-15%)
    reason: str


@dataclass
class Roadmap:
    milestones: list[RoadmapMilestone]
    total_weeks: int
    estimated_score_improvement: float
    ai_plan: str = ""  # AI-generated learning strategy


def generate_roadmap(
    missing_skills: list[str],
    existing_skills: list[str],
    match_scores: dict[str, float] | None = None,
) -> Roadmap:
    """Generate a sequenced learning roadmap from missing skills.

    Prioritization:
    1. Skills with most job impact (based on match score improvement)
    2. Skills with fewest prerequisites (quickest wins)
    3. Skills that unlock other missing skills (multiplier effect)
    """
    existing_set = set(existing_skills)
    milestones: list[RoadmapMilestone] = []
    seen: set[str] = set()

    # Score each missing skill by priority
    scored_skills = _prioritize(missing_skills, existing_set)

    for skill, priority, impact in scored_skills:
        # Get full learning path (includes prerequisites)
        path = get_full_learning_path(skill, existing_set | seen)

        for step in path:
            if step in seen:
                continue
            seen.add(step)

            is_target = step == skill
            prereqs = [p for p in get_full_learning_path(step, existing_set) if p != step]

            milestones.append(RoadmapMilestone(
                skill=step,
                effort_weeks=get_effort_weeks(step),
                prerequisites=prereqs[:3],
                priority=priority if is_target else "medium",
                impact_estimate=impact if is_target else impact * 0.3,
                reason=f"Required for {skill}" if not is_target else f"Directly required by target role",
            ))

    total_weeks = sum(m.effort_weeks for m in milestones)
    total_impact = min(sum(m.impact_estimate for m in milestones), 40.0)

    return Roadmap(
        milestones=milestones[:15],  # Cap at 15 milestones
        total_weeks=total_weeks,
        estimated_score_improvement=round(total_impact, 1),
    )


def _prioritize(
    missing_skills: list[str], existing: set[str]
) -> list[tuple[str, str, float]]:
    """Score and sort missing skills by priority.

    Returns: [(skill, priority_label, impact_estimate)]
    """
    scored: list[tuple[str, str, float, int]] = []

    for skill in missing_skills:
        path = get_full_learning_path(skill, existing)
        path_length = len(path)

        # Impact: inversely proportional to how many skills are missing
        # (fewer missing = each one matters more)
        base_impact = 100.0 / max(len(missing_skills), 1)
        impact = min(base_impact * 1.5, 15.0)  # Cap at 15% per skill

        # Priority: fewer prerequisites = quicker win
        if path_length <= 1:
            priority = "high"
            sort_key = 0
        elif path_length <= 3:
            priority = "medium"
            sort_key = 1
        else:
            priority = "low"
            sort_key = 2

        scored.append((skill, priority, impact, sort_key))

    scored.sort(key=lambda x: (x[3], -x[2]))
    return [(s[0], s[1], s[2]) for s in scored]


async def stream_roadmap_plan(
    roadmap: Roadmap,
    existing_skills: list[str],
    target_role: str = "",
) -> AsyncGenerator[AIStreamChunk, None]:
    """Stream AI-generated learning strategy for the roadmap."""
    provider = get_ai_provider()

    milestone_text = "\n".join(
        f"- {m.skill} ({m.effort_weeks} weeks, {m.priority} priority)"
        for m in roadmap.milestones[:10]
    )

    messages = [
        AIMessage(role="system", content="""You are a career development advisor.
Generate a concise, actionable learning plan for the skill roadmap below.
For each major skill, suggest: one learning resource, one portfolio project idea, and one milestone to demonstrate competency.
Keep it practical and specific. Under 500 words total."""),
        AIMessage(role="user", content=f"""Current skills: {', '.join(existing_skills[:15])}
Target role: {target_role or 'Not specified'}
Estimated total effort: {roadmap.total_weeks} weeks

Skills to learn (in order):
{milestone_text}

Generate a learning plan."""),
    ]

    async for chunk in provider.generate_stream(messages, temperature=0.7, max_tokens=800):
        yield chunk
