"""Unified Intelligence Orchestrator — single coordination layer across all engines.

Execution flow:
  Analysis → Memory → Trajectory → Roadmap → Market → Recommendations → Feed
"""

from __future__ import annotations
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.intelligence.intelligence_repository import IntelligenceRepository
from app.services.trajectory import compute_trajectory, TrajectoryRepository, TrajectoryEvent
from app.services.roadmap_intel import mutate_existing_roadmap, RoadmapRepository
from app.services.market_intelligence import compute_market_intelligence
from app.services.intelligence.orchestrator_recommendations import generate_recommendations


async def run_intelligence_cycle(db: AsyncSession, user_id: str, target_skills: list[str] | None = None) -> dict:
    """Execute full intelligence cycle. Returns unified summary."""
    intel_repo = IntelligenceRepository(db)
    traj_repo = TrajectoryRepository(db)
    roadmap_repo = RoadmapRepository(db)

    # 1. Gather current state
    skills_db = await intel_repo.get_user_skills(user_id)
    profile = await intel_repo.get_or_create_career_profile(user_id)
    roadmap = await roadmap_repo.get_active(user_id)

    user_skills = [s.normalized_skill for s in skills_db]
    confidences = {s.normalized_skill: s.confidence_score for s in skills_db}
    completed = (roadmap.completed_nodes or []) if roadmap else []
    deferred = (roadmap.deferred_nodes or []) if roadmap else []
    effective_target = target_skills or []

    if not effective_target and roadmap and roadmap.roadmap_snapshot:
        effective_target = [m["skill"] for m in roadmap.roadmap_snapshot.get("milestones", [])]

    # 2. Trajectory computation
    prev_snapshot = await traj_repo.get_latest(user_id)
    prev_dominant = prev_snapshot.dominant_path if prev_snapshot else None

    trajectory = compute_trajectory(
        user_skills=user_skills,
        skill_confidences=confidences,
        completed_nodes=completed,
        deferred_nodes=deferred,
        growth_velocity=profile.growth_velocity or 0.0,
        previous_dominant=prev_dominant,
    )

    # Persist trajectory
    await traj_repo.upsert(user_id, {
        "dominant_path": trajectory["dominant_path"],
        "secondary_paths": trajectory["secondary_paths"],
        "readiness_scores": trajectory["readiness_scores"],
        "specializations": trajectory["specializations"],
        "adjacent_roles": trajectory["adjacent_roles"],
        "competitiveness_score": trajectory["competitiveness_score"],
        "confidence_score": trajectory["confidence"],
        "drift_detected": trajectory["drift_details"],
    })

    if trajectory["drift_detected"]:
        await traj_repo.append_event(TrajectoryEvent(
            user_id=user_id, event_type="trajectory_drift",
            structured_payload={"to": trajectory["dominant_path"], "from": prev_dominant},
        ))

    # 3. Roadmap mutation (if target skills available)
    mutations = None
    if effective_target:
        mutations = await mutate_existing_roadmap(db, user_id, effective_target)

    # 4. Market intelligence
    market = compute_market_intelligence(
        user_skills=user_skills,
        skill_confidences=confidences,
        target_role=roadmap.target_role if roadmap else trajectory["dominant_path"],
        seniority=profile.inferred_seniority or "mid",
        growth_velocity=profile.growth_velocity or 0.0,
    )

    # 5. Strategic recommendations
    recommendations = generate_recommendations(
        trajectory=trajectory,
        market=market,
        roadmap_state=roadmap,
        completed_nodes=completed,
        deferred_nodes=deferred,
        user_skills=user_skills,
    )

    # 6. Build unified summary
    summary = {
        "dominant_path": trajectory["dominant_path"],
        "secondary_paths": trajectory["secondary_paths"],
        "competitiveness": trajectory["competitiveness_score"],
        "confidence": trajectory["confidence"],
        "specializations": trajectory["specializations"],
        "market_alignment": market["recruiter_attractiveness"]["overall_score"],
        "salary_range": market["salary_trajectory"]["estimated_range"],
        "growth_potential": market["salary_trajectory"]["growth_potential"],
        "roadmap_momentum": len(mutations["mutations"]) if mutations and mutations.get("mutations") else 0,
        "focus_areas": (roadmap.active_focus_areas if roadmap else []) or [],
        "adjacent_roles": trajectory["adjacent_roles"][:3],
        "drift_detected": trajectory["drift_detected"],
        "drift_details": trajectory["drift_details"],
    }

    return {
        "summary": summary,
        "recommendations": recommendations,
        "trajectory": trajectory,
        "market": market,
    }


async def get_intelligence_summary_readonly(db: AsyncSession, user_id: str) -> dict:
    """Read-only variant of intelligence cycle for GET endpoints.
    Fetches latest persisted state without mutations or recomputation.
    """
    intel_repo = IntelligenceRepository(db)
    traj_repo = TrajectoryRepository(db)
    roadmap_repo = RoadmapRepository(db)

    profile = await intel_repo.get_or_create_career_profile(user_id)
    roadmap = await roadmap_repo.get_active(user_id)
    snapshot = await traj_repo.get_latest(user_id)

    if not snapshot:
        # Return empty state if no trajectory has been computed yet
        trajectory = {
            "dominant_path": "Generalist",
            "secondary_paths": [],
            "readiness_scores": {},
            "specializations": {},
            "adjacent_roles": [],
            "competitiveness_score": 0.0,
            "confidence": 0.0,
            "drift_detected": False,
            "drift_details": None,
        }
    else:
        trajectory = {
            "dominant_path": snapshot.dominant_path,
            "secondary_paths": snapshot.secondary_paths,
            "readiness_scores": snapshot.readiness_scores,
            "specializations": snapshot.specializations,
            "adjacent_roles": snapshot.adjacent_roles,
            "competitiveness_score": snapshot.competitiveness_score,
            "confidence": snapshot.confidence_score,
            "drift_detected": bool(snapshot.drift_detected),
            "drift_details": snapshot.drift_detected,
        }

    user_skills = []
    skills_db = await intel_repo.get_user_skills(user_id)
    if skills_db:
        user_skills = [s.normalized_skill for s in skills_db]
        confidences = {s.normalized_skill: s.confidence_score for s in skills_db}
    else:
        confidences = {}

    completed = (roadmap.completed_nodes or []) if roadmap else []
    deferred = (roadmap.deferred_nodes or []) if roadmap else []

    market = compute_market_intelligence(
        user_skills=user_skills,
        skill_confidences=confidences,
        target_role=roadmap.target_role if roadmap else trajectory["dominant_path"],
        seniority=profile.inferred_seniority or "mid",
        growth_velocity=profile.growth_velocity or 0.0,
    )

    recommendations = generate_recommendations(
        trajectory=trajectory,
        market=market,
        roadmap_state=roadmap,
        completed_nodes=completed,
        deferred_nodes=deferred,
        user_skills=user_skills,
    )

    summary = {
        "dominant_path": trajectory["dominant_path"],
        "secondary_paths": trajectory["secondary_paths"],
        "competitiveness": trajectory["competitiveness_score"],
        "confidence": trajectory["confidence"],
        "specializations": trajectory["specializations"],
        "market_alignment": market["recruiter_attractiveness"]["overall_score"],
        "salary_range": market["salary_trajectory"]["estimated_range"],
        "growth_potential": market["salary_trajectory"]["growth_potential"],
        "roadmap_momentum": 0,  # Read-only doesn't trigger mutations
        "focus_areas": (roadmap.active_focus_areas if roadmap else []) or [],
        "adjacent_roles": trajectory["adjacent_roles"][:3],
        "drift_detected": trajectory["drift_detected"],
        "drift_details": trajectory["drift_details"],
    }

    return {
        "summary": summary,
        "recommendations": recommendations,
        "trajectory": trajectory,
        "market": market,
    }
