"""Strategic Focus API — unified prioritization and execution planning."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.intelligence.orchestrator import get_intelligence_summary_readonly
from app.services.execution import compute_execution_profile
from app.services.risk import compute_career_risks
from app.services.prioritization import compute_strategic_focus
from app.services.planning import generate_execution_plan
from app.services.roadmap_intel import RoadmapRepository
from app.services.workspace import WorkspaceRepository

router = APIRouter(prefix="/v1/strategic", tags=["Strategic"])

from app.services.cache import cache_get, cache_set


@router.get("/lifecycle")
async def get_lifecycle_state(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lightweight lifecycle snapshot for frontend polling (single round-trip)."""
    from app.services.strategic_profile_service import get_strategic_profile
    from sqlalchemy import select
    from app.models.resume import Resume

    profile = await get_strategic_profile(db, current_user.id)
    latest_resume = await db.execute(
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
        .limit(1)
    )
    latest = latest_resume.scalar_one_or_none()
    latest_status = latest.parse_status if latest else None
    parse_stage = latest_status or "none"

    has_profile = bool(
        profile
        and (
            (profile.inferred_skills and len(profile.inferred_skills) > 0)
            or profile.target_role
        )
    )

    if not latest_status:
        parse_status = "none"
    elif latest_status in ("processing", "pending", "extracting_text", "parsing_resume", "extracting_skills", "building_profile"):
        parse_status = "processing"
    elif latest_status == "enriching_profile":
        parse_status = "completed"
        parse_stage = "enriching_profile"
    elif latest_status == "failed":
        parse_status = "failed"
    elif latest_status == "completed":
        parse_status = "completed"
    else:
        parse_status = "pending"

    if has_profile:
        lifecycle_stage = 3
    elif parse_status == "processing":
        lifecycle_stage = 2
    else:
        lifecycle_stage = 1

    return {
        "has_strategic_profile": has_profile,
        "resume_parse_status": parse_status,
        "parse_stage": parse_stage,
        "lifecycle_stage": lifecycle_stage,
    }


@router.get("/focus")
async def get_strategic_focus(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full strategic focus profile: prioritization + execution plan."""
    cache_key = f"strategic:focus:{current_user.id}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    intel = await get_intelligence_summary_readonly(db, current_user.id)
    summary = intel["summary"]
    trajectory = intel["trajectory"]
    market = intel["market"]
    recommendations = intel["recommendations"]

    roadmap_repo = RoadmapRepository(db)
    workspace_repo = WorkspaceRepository(db)
    roadmap = await roadmap_repo.get_active(current_user.id)
    actions = await workspace_repo.get_actions(current_user.id)

    completed = (roadmap.completed_nodes or []) if roadmap else []
    deferred = (roadmap.deferred_nodes or []) if roadmap else []
    action_dicts = [{"action": a.action, "type": a.recommendation_type} for a in actions]

    # Execution profile
    execution = compute_execution_profile(
        completed_nodes=completed, deferred_nodes=deferred,
        recommendation_actions=action_dicts, operational_events=[],
        roadmap_version=roadmap.roadmap_version if roadmap else 0,
        growth_velocity=summary.get("competitiveness", 0),
        last_upload_at=None,
        last_activity_at=roadmap.updated_at.isoformat() if roadmap and roadmap.updated_at else None,
    )

    # Risks
    risks = compute_career_risks(execution_profile=execution, trajectory=trajectory, market=market, user_skills=list(trajectory.get("specializations", {}).keys()))

    # Strategic focus
    focus = compute_strategic_focus(
        execution_profile=execution, trajectory=trajectory, market=market,
        risks=risks, roadmap_state=roadmap, recommendations=recommendations,
    )

    # Execution plan
    plan = generate_execution_plan(focus_profile=focus, execution_profile=execution, roadmap_state=roadmap, market=market)

    from app.services.personalization.personalization_engine import calibrate_personalization
    user_skills = list(trajectory.get("specializations", {}).keys())
    p_target_role = summary.get("dominant_path", "Software Engineer")
    p_specialization = summary.get("dominant_path", "General")

    personalization = calibrate_personalization(
        skills=user_skills,
        target_role=p_target_role,
        specialization=p_specialization,
        completed_milestones=len(completed)
    )

    result = {
        "focus": focus,
        "plan": plan,
        "execution": execution,
        "risks": {"risk_score": risks["risk_score"], "count": risks["risk_count"]},
        "personalization": personalization
    }
    await cache_set(cache_key, result, "short")
    return result


from pydantic import BaseModel
from typing import List, Optional

class ProfileUpdateRequest(BaseModel):
    skills: List[str]
    target_role: str
    specialization: str
    years_of_experience: Optional[float] = 1.0


def _resolve_years_of_experience(trajectory_state: Optional[dict]) -> float:
    if not trajectory_state:
        return 5.0
    years = trajectory_state.get("years_of_experience")
    if years is not None:
        return round(float(years), 1)
    return 5.0

@router.get("/profile")
async def get_strategic_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve candidate strategic profile directly from the DB."""
    import time
    from app.logger import logger
    t_start = time.perf_counter()

    t0 = time.perf_counter()
    from sqlalchemy import select
    from app.models.strategic_profile import StrategicProfile

    result = await db.execute(
        select(StrategicProfile).where(StrategicProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    dt_db = (time.perf_counter() - t0) * 1000
    logger.debug(f"[PROFILE] DB={dt_db:.2f}ms")

    t0 = time.perf_counter()
    if not profile:
        res = {
            "skills": [],
            "target_role": "",
            "specialization": "",
            "years_of_experience": 0.0,
            "completeness_score": 0
        }
        dt_build = (time.perf_counter() - t0) * 1000
        logger.debug(f"[PROFILE] User Build={dt_build:.2f}ms")

        dt_total = (time.perf_counter() - t_start) * 1000
        logger.debug(f"[PROFILE] Total={dt_total:.2f}ms")
        return res

    skills = profile.inferred_skills or []
    origins = {}
    if profile.trajectory_state:
        origins = profile.trajectory_state.get("skill_origins", {}) or {}

    # Map origins (fallback to 'resume' if unknown)
    decorated_skills = [{"name": s, "origin": origins.get(s, "resume")} for s in skills]

    # Calculate completeness score based on skills and profile details
    completeness = min(100, max(25, len(skills) * 5 + 15))
    dt_build = (time.perf_counter() - t0) * 1000
    logger.debug(f"[PROFILE] User Build={dt_build:.2f}ms")

    t0 = time.perf_counter()
    res = {
        "skills": decorated_skills,
        "target_role": profile.target_role or "Senior Full Stack Engineer",
        "specialization": profile.active_specialization or "Full Stack",
        "years_of_experience": _resolve_years_of_experience(profile.trajectory_state),
        "completeness_score": completeness
    }
    dt_serialization = (time.perf_counter() - t0) * 1000
    logger.debug(f"[PROFILE] Serialization={dt_serialization:.2f}ms")

    dt_total = (time.perf_counter() - t_start) * 1000
    logger.debug(f"[PROFILE] Total={dt_total:.2f}ms")
    return res

@router.post("/profile/update")
async def update_strategic_profile(
    body: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually update candidate strategic profile, and regenerate roadmap + opportunities."""
    from sqlalchemy import select
    from app.models.strategic_profile import StrategicProfile
    from app.services.llm.generators import generate_adaptive_roadmap
    from app.services.opportunity_engine.ingestion import match_jobs_for_candidate
    from app.services.resume_pipeline.role_inference import infer_strategic_role
    from datetime import datetime, timezone

    # 1. Fetch current profile
    result = await db.execute(
        select(StrategicProfile).where(StrategicProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    # 2. Run trajectory inference on the updated skills
    from app.services.resume_pipeline.skill_mapper import map_and_normalize_skills
    normalized_skills = map_and_normalize_skills(body.skills)
    trajectory = infer_strategic_role(normalized_skills)
    dominant_path = trajectory.get("dominant_path", "Software Engineer")

    # Compute updated skill trust origins
    old_origins = {}
    if profile and profile.trajectory_state:
        old_origins = profile.trajectory_state.get("skill_origins", {}) or {}

    new_origins = {}
    for s in normalized_skills:
        if s in old_origins:
            new_origins[s] = old_origins[s]
        else:
            new_origins[s] = "user"  # Newly manually-added skills

    readiness = trajectory.get("readiness_scores", {})
    dominant_readiness = readiness.get(dominant_path, {})
    gaps = dominant_readiness.get("missing_core", [])

    years_of_experience = round(float(body.years_of_experience or 5.0), 1)

    # 3. Regenerate roadmap
    roadmap_nodes = await generate_adaptive_roadmap(
        target_role=body.target_role,
        validated_skills=normalized_skills,
        gaps=gaps
    )

    # 4. Initialize recruiter signals
    recruiter_signals = {
        "hiringConfidence": float(trajectory.get("confidence", 0.85)),
        "productionReadiness": float(trajectory.get("competitiveness_score", 0.80)),
        "technicalDepth": 0.80,
        "specializationStrength": 0.85,
        "differentiationScore": 0.82,
        "portfolioMaturity": "production_mature",
        "strongestSignals": [
            f"Manually calibrated specialization in {body.specialization}",
            f"Expert competency vector with {len(normalized_skills)} verified skills"
        ],
        "hiringRisks": [
            f"Deficit gap detected: {gap}" for gap in gaps[:2]
        ],
        "roleFit": [
            {
                "role": body.target_role,
                "skillReadiness": float(dominant_readiness.get("score", 0.85)),
                "proofAdjusted": float(dominant_readiness.get("score", 0.85)) - 0.05,
                "missing": gaps
            }
        ]
    }

    roadmap_progress = {
        "completedPercent": 0,
        "completedCount": 0,
        "totalCount": len(roadmap_nodes)
    }

    if not profile:
        # Create new profile
        profile = StrategicProfile(
            user_id=current_user.id,
            inferred_skills=normalized_skills,
            active_specialization=body.specialization,
            target_role=body.target_role,
            roadmap_progress=roadmap_progress,
            opportunity_alignment=[],
            market_alignment=float(trajectory.get("competitiveness_score", 0.80) * 100),
            ai_recommendations=[
                {
                    "priority": "high",
                    "title": f"Bridge {gaps[0]} deficit",
                    "explanation": f"Focus on completing target project templates for {gaps[0]} to raise matching rates."
                }
                for i in range(1) if gaps
            ],
            trajectory_state={
                "dominant_path": dominant_path,
                "secondary_paths": trajectory.get("secondary_paths", []),
                "readiness_scores": readiness,
                "adjacent_roles": trajectory.get("adjacent_roles", []),
                "competitiveness_score": trajectory.get("competitiveness_score", 0.80),
                "years_of_experience": years_of_experience,
                "skill_origins": new_origins,
                "user_calibrated": True,
            },
            calibration_history=[
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "event": "Profile calibrated during onboarding setup."
                }
            ],
            recruiter_signals=recruiter_signals
        )
        db.add(profile)
    else:
        profile.inferred_skills = normalized_skills
        profile.active_specialization = body.specialization
        profile.target_role = body.target_role
        profile.roadmap_progress = roadmap_progress
        profile.market_alignment = float(trajectory.get("competitiveness_score", 0.80) * 100)
        profile.trajectory_state = {
            "dominant_path": dominant_path,
            "secondary_paths": trajectory.get("secondary_paths", []),
            "readiness_scores": readiness,
            "adjacent_roles": trajectory.get("adjacent_roles", []),
            "competitiveness_score": trajectory.get("competitiveness_score", 0.80),
            "years_of_experience": years_of_experience,
            "skill_origins": new_origins,
            "user_calibrated": True,
        }
        profile.recruiter_signals = recruiter_signals
        profile.calibration_history.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": "Recalibrated profile metrics manually."
        })
        profile.updated_at = datetime.now(timezone.utc)

    from app.services.strategic_profile_service import (
        sync_legacy_intelligence_from_profile,
        sync_legacy_roadmap_from_profile,
    )
    await sync_legacy_intelligence_from_profile(db, current_user.id, profile)
    await sync_legacy_roadmap_from_profile(
        db,
        current_user.id,
        profile,
        milestones=roadmap_nodes,
        focus_areas=gaps[:3],
        coverage=dominant_readiness.get("score", 0.85),
        learning_velocity=trajectory.get("competitiveness_score", 0.80),
    )

    await db.flush()

    # Generate opportunities
    match_result = await match_jobs_for_candidate(profile)
    profile.opportunity_alignment = match_result["matches"]
    trajectory_state = profile.trajectory_state or {}
    if match_result.get("degraded"):
        trajectory_state["opportunity_feed"] = {
            "degraded": True,
            "message": match_result.get("message"),
        }
    else:
        trajectory_state.pop("opportunity_feed", None)
    profile.trajectory_state = trajectory_state

    # Calibrate User Progress
    from app.services.user_progress_service import track_score_update
    await track_score_update(
        db=db,
        user_id=current_user.id,
        recruiter_score=float(trajectory.get("competitiveness_score", 0.80) * 100),
        market_readiness=float(trajectory.get("competitiveness_score", 0.80) * 100),
        specialization=body.specialization
    )

    # Invalidate cache for new stats to populate
    from app.services.cache import cache_invalidate
    await cache_invalidate(f"opportunities:matches:{current_user.id}")
    await cache_invalidate(f"opportunities:gaps:{current_user.id}")
    await cache_invalidate(f"opportunities:radar:{current_user.id}")
    await cache_invalidate(f"market_intelligence:snapshot:{current_user.id}")

    return {"message": "Strategic Profile saved and calibrated successfully", "target_role": body.target_role}
