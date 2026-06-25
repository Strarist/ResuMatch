"""Unified Intelligence Orchestrator — single coordination layer across all engines.

Execution flow:
  Analysis → Memory → Trajectory → Roadmap → Market → Recommendations → Feed
"""

from __future__ import annotations
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.strategic_profile import StrategicProfile
from app.services.strategic_profile_service import get_profile_context, load_intelligence_inputs
from app.services.trajectory import compute_trajectory, TrajectoryRepository, TrajectoryEvent
from app.services.roadmap_intel import mutate_existing_roadmap, RoadmapRepository
from app.services.market_intelligence import compute_market_intelligence
from app.services.intelligence.orchestrator_recommendations import generate_recommendations


async def run_intelligence_cycle(db: AsyncSession, user_id: str, target_skills: list[str] | None = None) -> dict:
    """Execute full intelligence cycle. Returns unified summary."""
    inputs = await load_intelligence_inputs(db, user_id)
    traj_repo = TrajectoryRepository(db)
    roadmap_repo = RoadmapRepository(db)
    roadmap = await roadmap_repo.get_active(user_id)

    user_skills = inputs["skills"]
    confidences = inputs["skill_confidences"]
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
        growth_velocity=inputs["growth_velocity"],
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
        target_role=inputs["target_role"] or (roadmap.target_role if roadmap else trajectory["dominant_path"]),
        seniority=inputs["seniority"],
        growth_velocity=inputs["growth_velocity"],
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

    # 7. Persist or update StrategicProfile database record
    profile_result = await db.execute(
        select(StrategicProfile).where(StrategicProfile.user_id == user_id)
    )
    strategic_profile = profile_result.scalar_one_or_none()

    market_alignment = float(market["recruiter_attractiveness"]["overall_score"] * 100)

    recruiter_signals = {
        "hiringConfidence": float(trajectory["confidence"]),
        "productionReadiness": float(trajectory["competitiveness_score"]),
        "technicalDepth": 0.85,
        "specializationStrength": 0.88,
        "differentiationScore": 0.84,
        "portfolioMaturity": "production_mature",
        "strongestSignals": [
            f"Strong capability matching in {trajectory['dominant_path']}"
        ],
        "hiringRisks": [],
        "roleFit": [
            {
                "role": trajectory["dominant_path"],
                "skillReadiness": float(trajectory["competitiveness_score"]),
                "proofAdjusted": float(trajectory["competitiveness_score"]) - 0.05,
                "missing": []
            }
        ]
    }

    target_role = inputs["target_role"] or (roadmap.target_role if roadmap else trajectory["dominant_path"])

    if strategic_profile:
        existing_ts = strategic_profile.trajectory_state or {}
        user_calibrated = bool(existing_ts.get("user_calibrated"))
        merged_trajectory = {**trajectory}
        if existing_ts.get("years_of_experience") is not None:
            merged_trajectory["years_of_experience"] = existing_ts["years_of_experience"]
        if user_calibrated:
            merged_trajectory["user_calibrated"] = True

        strategic_profile.inferred_skills = user_skills
        if not user_calibrated:
            strategic_profile.active_specialization = inputs["specialization"] or trajectory["dominant_path"]
            strategic_profile.target_role = target_role
        strategic_profile.market_alignment = market_alignment
        strategic_profile.trajectory_state = merged_trajectory
        strategic_profile.recruiter_signals = recruiter_signals
        strategic_profile.updated_at = datetime.now(timezone.utc)
    else:
        strategic_profile = StrategicProfile(
            user_id=user_id,
            inferred_skills=user_skills,
            active_specialization=inputs["specialization"] or trajectory["dominant_path"],
            target_role=target_role,
            roadmap_progress={"completedPercent": 0, "completedCount": 0, "totalCount": len(completed) + len(deferred)},
            opportunity_alignment=[],
            market_alignment=market_alignment,
            ai_recommendations=recommendations,
            trajectory_state=trajectory,
            calibration_history=[{"timestamp": datetime.now(timezone.utc).isoformat(), "event": "Recomputed intelligence."}],
            recruiter_signals=recruiter_signals
        )
        db.add(strategic_profile)
    await db.flush()

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
    ctx = await get_profile_context(db, user_id)

    if ctx["has_profile"] and ctx["profile"]:
        strategic_profile = ctx["profile"]
        roadmap_repo = RoadmapRepository(db)
        roadmap = await roadmap_repo.get_active(user_id)
        roadmap_progress = ctx["roadmap_progress"]
        focus_areas = (roadmap.active_focus_areas if roadmap else []) or []
        trajectory_state = ctx["trajectory_state"] or {}
        summary = {
            "dominant_path": trajectory_state.get("dominant_path", "Generalist"),
            "secondary_paths": trajectory_state.get("secondary_paths", []),
            "competitiveness": trajectory_state.get("competitiveness_score", 0.0),
            "confidence": trajectory_state.get("confidence", 0.85),
            "specializations": trajectory_state.get("specializations", {}),
            "market_alignment": ctx["market_alignment"] / 100.0,
            "salary_range": strategic_profile.recruiter_signals.get("salary_range", "$140k - $170k"),
            "growth_potential": "high" if ctx["market_alignment"] > 80.0 else "moderate",
            "roadmap_momentum": roadmap_progress.get("completedCount", 0),
            "focus_areas": focus_areas,
            "adjacent_roles": trajectory_state.get("adjacent_roles", [])[:3],
            "drift_detected": False,
            "drift_details": None,
        }
        return {
            "summary": summary,
            "recommendations": strategic_profile.ai_recommendations or [],
            "trajectory": trajectory_state,
            "market": {
                "recruiter_attractiveness": {"overall_score": ctx["market_alignment"] / 100.0},
                "salary_trajectory": {"estimated_range": {"low": 140000, "high": 170000}, "growth_potential": "high"}
            }
        }

    inputs = await load_intelligence_inputs(db, user_id)
    traj_repo = TrajectoryRepository(db)
    roadmap_repo = RoadmapRepository(db)
    roadmap = await roadmap_repo.get_active(user_id)
    snapshot = await traj_repo.get_latest(user_id)

    if not snapshot:
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

    user_skills = inputs["skills"]
    confidences = inputs["skill_confidences"]
    completed = (roadmap.completed_nodes or []) if roadmap else []
    deferred = (roadmap.deferred_nodes or []) if roadmap else []

    market = compute_market_intelligence(
        user_skills=user_skills,
        skill_confidences=confidences,
        target_role=inputs["target_role"] or (roadmap.target_role if roadmap else trajectory["dominant_path"]),
        seniority=inputs["seniority"],
        growth_velocity=inputs["growth_velocity"],
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
        "roadmap_momentum": 0,
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
