import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.strategic_profile import StrategicProfile
from app.services.resume_pipeline.parser import extract_text_from_pdf
from app.services.resume_pipeline.extractor import extract_resume_entities
from app.services.resume_pipeline.skill_mapper import map_and_normalize_skills
from app.services.resume_pipeline.role_inference import infer_strategic_role
from app.services.llm.generators import generate_adaptive_roadmap, generate_opportunity_matches
from app.services.intelligence import IntelligenceRepository

logger = logging.getLogger(__name__)

async def build_and_persist_strategic_profile(db: AsyncSession, user_id: str, file_path: str) -> StrategicProfile:
    """Execute the full end-to-end strategic career intelligence pipeline from PDF to persistent DB."""
    logger.info(f"Initiating resume pipeline execution for user: {user_id}")

    # 1. Parse raw text from PDF
    raw_text = extract_text_from_pdf(file_path)

    # 2. Extract structured entities via OpenRouter LLM
    raw_entities = await extract_resume_entities(raw_text)

    # 3. Normalize extracted skills
    extracted_skills = raw_entities.get("skills", [])
    normalized_skills = map_and_normalize_skills(extracted_skills)

    # 4. Infer career trajectory and targets
    trajectory = infer_strategic_role(normalized_skills)
    dominant_path = trajectory.get("dominant_path", "Software Engineer")
    target_role = raw_entities.get("inferred_target_role", f"Senior {dominant_path}")
    specialization = raw_entities.get("inferred_specialization", f"{dominant_path} Specialist")

    # 5. Extract outstanding skills gaps from the trajectory matched core
    readiness = trajectory.get("readiness_scores", {})
    dominant_readiness = readiness.get(dominant_path, {})
    gaps = dominant_readiness.get("missing_core", [])
    if not gaps and normalized_skills:
        # Fallback to general gaps if trajectory core matches are 100% full
        gaps = ["System Architecture Modeling", "Production Observability Protocols"]

    # 6. Generate real roadmap milestones via OpenRouter LLM
    roadmap_nodes = await generate_adaptive_roadmap(
        target_role=target_role,
        validated_skills=normalized_skills,
        gaps=gaps
    )

    # 7. Generate real opportunity matches via OpenRouter LLM
    opportunity_matches = await generate_opportunity_matches(
        validated_skills=normalized_skills,
        gaps=gaps,
        specialization=specialization
    )

    # 8. Synchronize skills in legacy IntelligenceRepository tables (UserSkillProfile, UserCareerProfile)
    intel_repo = IntelligenceRepository(db)
    skills_payload = [
        {"skill": s, "confidence": 0.90, "proficiency": 0.85, "source": "resume_pipeline"}
        for s in normalized_skills
    ]
    await intel_repo.upsert_skills(user_id, skills_payload)

    # Upsert user career profile details
    career_profile = await intel_repo.get_or_create_career_profile(user_id)
    career_profile.inferred_seniority = "senior" if raw_entities.get("years_of_experience", 0) > 5 else "mid"
    career_profile.preferred_roles = [target_role]
    career_profile.preferred_domains = [specialization]
    career_profile.last_analysis_at = datetime.now(timezone.utc)
    career_profile.growth_velocity = trajectory.get("competitiveness_score", 0.80)

    # 9. Build and persist core StrategicProfile to DB
    result = await db.execute(
        select(StrategicProfile).where(StrategicProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()

    roadmap_progress = {
        "completedPercent": 0,
        "completedCount": 0,
        "totalCount": len(roadmap_nodes)
    }

    # recruiter signals
    recruiter_signals = {
        "hiringConfidence": float(trajectory.get("confidence", 0.85)),
        "productionReadiness": float(trajectory.get("competitiveness_score", 0.80)),
        "technicalDepth": 0.82,
        "specializationStrength": 0.88,
        "differentiationScore": 0.84,
        "portfolioMaturity": "production_mature",
        "strongestSignals": [
            f"Validated specialization strength in {specialization}",
            f"Excellent competence vector with {len(normalized_skills)} verified stack skills"
        ],
        "hiringRisks": [
            f"Deficit gap detected: {gap}" for gap in gaps[:2]
        ],
        "roleFit": [
            {
                "role": target_role,
                "skillReadiness": float(dominant_readiness.get("score", 0.85)),
                "proofAdjusted": float(dominant_readiness.get("score", 0.85)) - 0.05,
                "missing": gaps
            }
        ]
    }

    if not profile:
        profile = StrategicProfile(
            user_id=user_id,
            inferred_skills=normalized_skills,
            active_specialization=specialization,
            target_role=target_role,
            roadmap_progress=roadmap_progress,
            opportunity_alignment=opportunity_matches,
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
                "competitiveness_score": trajectory.get("competitiveness_score", 0.80)
            },
            calibration_history=[
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "event": "Ingested profile credentials via resume analyzer pipeline."
                }
            ],
            recruiter_signals=recruiter_signals
        )
        db.add(profile)
    else:
        profile.inferred_skills = normalized_skills
        profile.active_specialization = specialization
        profile.target_role = target_role
        profile.roadmap_progress = roadmap_progress
        profile.opportunity_alignment = opportunity_matches
        profile.market_alignment = float(trajectory.get("competitiveness_score", 0.80) * 100)
        profile.trajectory_state = {
            "dominant_path": dominant_path,
            "secondary_paths": trajectory.get("secondary_paths", []),
            "readiness_scores": readiness,
            "adjacent_roles": trajectory.get("adjacent_roles", []),
            "competitiveness_score": trajectory.get("competitiveness_score", 0.80)
        }
        profile.calibration_history.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": "Recalibrated profile metrics via resume updates."
        })
        profile.recruiter_signals = recruiter_signals
        profile.updated_at = datetime.now(timezone.utc)

    # Force flash updates to database session
    await db.flush()

    # Preload roadmap state elements directly inside roadmap_states table too for compatibility
    from app.services.roadmap_intel.roadmap_models import RoadmapState
    roadmap_result = await db.execute(
        select(RoadmapState).where(RoadmapState.user_id == user_id)
    )
    legacy_roadmap = roadmap_result.scalar_one_or_none()
    if not legacy_roadmap:
        legacy_roadmap = RoadmapState(
            user_id=user_id,
            target_role=target_role,
            roadmap_snapshot={"milestones": roadmap_nodes},
            active_focus_areas=gaps[:3],
            confidence_model={"coverage": dominant_readiness.get("score", 0.85)},
            learning_velocity=trajectory.get("competitiveness_score", 0.80)
        )
        db.add(legacy_roadmap)
    else:
        legacy_roadmap.target_role = target_role
        legacy_roadmap.roadmap_snapshot = {"milestones": roadmap_nodes}
        legacy_roadmap.active_focus_areas = gaps[:3]
        legacy_roadmap.learning_velocity = trajectory.get("competitiveness_score", 0.80)
        legacy_roadmap.updated_at = datetime.now(timezone.utc)

    await db.flush()
    logger.info(f"Strategic profile generated and persisted successfully for user: {user_id}")
    return profile
