import logging
import time
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.strategic_profile import StrategicProfile
from app.services.resume_pipeline.parser import extract_text_from_pdf
from app.services.resume_pipeline.extractor import extract_resume_entities
from app.services.resume_pipeline.skill_mapper import map_and_normalize_skills
from app.services.resume_pipeline.role_inference import infer_strategic_role
from app.services.llm.generators import generate_adaptive_roadmap, generate_opportunity_matches

from app.logger import logger

async def build_and_persist_strategic_profile(db: AsyncSession, user_id: str, file_path: str, resume_id: str = None) -> tuple:
    """Execute the full end-to-end strategic career intelligence pipeline from PDF to persistent DB."""
    _pipeline_start = time.perf_counter()
    logger.bind(user_id=user_id, file_path=file_path, event="parse_started").info("parse_started: Initiating resume pipeline execution: Starting text extraction...")

    async def update_status(status_str: str):
        if resume_id:
            try:
                from app.models.resume import Resume
                from sqlalchemy import select
                # Since we want to update the database status immediately, we run a query and update
                stmt = select(Resume).where(Resume.id == resume_id)
                res = (await db.execute(stmt)).scalar_one_or_none()
                if res:
                    res.parse_status = status_str
                    await db.flush()
            except Exception as update_err:
                logger.warning(f"Failed to update parse status to {status_str}: {update_err}")

    # 1. Parse raw text from PDF
    try:
        await update_status("extracting_text")
        _t1 = time.perf_counter()
        raw_text = extract_text_from_pdf(file_path)
        _pdf_s = time.perf_counter() - _t1
        logger.bind(user_id=user_id, text_length=len(raw_text)).info(f"[PIPELINE] PDF Extraction: {_pdf_s * 1000:.2f}ms")
    except Exception as e:
        logger.bind(user_id=user_id).error(f"Step 1 Failed: PDF text extraction error: {e}")
        raise e

    # 2. Extract structured entities via OpenRouter LLM
    try:
        await update_status("parsing_resume")
        logger.bind(user_id=user_id).info("Step 2: Triggering OpenRouter LLM resume extraction...")
        _t2 = time.perf_counter()
        raw_entities = await extract_resume_entities(raw_text)
        _llm_resume_s = time.perf_counter() - _t2
        logger.bind(user_id=user_id, event="parse_completed").info(f"[PIPELINE] Text Parsing: {_llm_resume_s * 1000:.2f}ms")
        logger.bind(user_id=user_id, entity_keys=list(raw_entities.keys())).info("Step 2 Complete: OpenRouter LLM extraction completed.")
    except Exception as e:
        logger.bind(user_id=user_id).error(f"Step 2 Failed: OpenRouter LLM extraction error: {e}")
        raise e

    # 3. Normalize extracted skills
    try:
        await update_status("extracting_skills")
        extracted_skills = raw_entities.get("skills", [])
        logger.bind(user_id=user_id, raw_skills_count=len(extracted_skills)).info("Step 3: Normalizing skills...")
        _t3 = time.perf_counter()
        normalized_skills = map_and_normalize_skills(extracted_skills)
        # Fallback local heuristic parsing to avoid empty profile if LLM fails
        if not normalized_skills:
            logger.bind(user_id=user_id).info("Structured LLM skills extraction returned empty. Initiating high-fidelity local keyword parser...")
            text_lower = raw_text.lower()
            from app.ai.skill_normalization import _ALIASES
            local_extracted = []
            for canonical, aliases in _ALIASES.items():
                import re
                patterns = [re.escape(canonical.lower())] + [re.escape(a.lower()) for a in aliases]
                for pattern in patterns:
                    boundary = r"(?:\b|\s|^|$)" if any(c in pattern for c in ["#", "."]) else r"\b"
                    if re.search(f"{boundary}{pattern}{boundary}", text_lower):
                        local_extracted.append(canonical)
                        break
            if local_extracted:
                logger.bind(user_id=user_id, local_extracted_count=len(local_extracted)).info(f"Local keyword parser extracted {len(local_extracted)} technologies.")
                normalized_skills = local_extracted
        _skill_s = time.perf_counter() - _t3
        logger.bind(user_id=user_id, normalized_skills=normalized_skills).info(f"[PIPELINE] Skill Normalization: {_skill_s * 1000:.2f}ms")
    except Exception as e:
        logger.bind(user_id=user_id).error(f"Step 3 Failed: Skill normalization error: {e}")
        raise e

    # 4. Infer career trajectory and targets
    try:
        logger.bind(user_id=user_id).info("Step 4: Inferring career trajectory...")
        _t4 = time.perf_counter()
        trajectory = infer_strategic_role(normalized_skills)
        dominant_path = trajectory.get("dominant_path", "Software Engineer")
        target_role = raw_entities.get("inferred_target_role", f"Senior {dominant_path}")
        specialization = raw_entities.get("inferred_specialization", f"{dominant_path} Specialist")
        _traj_s = time.perf_counter() - _t4
        logger.bind(user_id=user_id, dominant_path=dominant_path, target_role=target_role, specialization=specialization).info(f"[PIPELINE] Trajectory Inference: {_traj_s * 1000:.2f}ms")
    except Exception as e:
        logger.bind(user_id=user_id).error(f"Step 4 Failed: Trajectory inference error: {e}")
        raise e

    # 5. Extract outstanding skills gaps from the trajectory matched core
    readiness = trajectory.get("readiness_scores", {})
    dominant_readiness = readiness.get(dominant_path, {})
    gaps = dominant_readiness.get("missing_core", [])
    if not gaps and normalized_skills:
        # Fallback to general gaps if trajectory core matches are 100% full
        gaps = ["System Architecture Modeling", "Production Observability Protocols"]
    logger.bind(user_id=user_id, gaps=gaps).info("Step 5 Complete: Skill gaps identified.")

    # 6. Generate real roadmap milestones via OpenRouter LLM
    try:
        await update_status("building_profile")
        logger.bind(user_id=user_id).info("Step 6: Generating adaptive roadmap milestones via OpenRouter...")
        _t6 = time.perf_counter()
        roadmap_nodes = await generate_adaptive_roadmap(
            target_role=target_role,
            validated_skills=normalized_skills,
            gaps=gaps
        )
        _roadmap_s = time.perf_counter() - _t6
        logger.bind(user_id=user_id, event="roadmap_created").info(f"[PIPELINE] Roadmap Generation: {_roadmap_s * 1000:.2f}ms")
        logger.bind(user_id=user_id, nodes_count=len(roadmap_nodes)).info("Step 6 Complete: Roadmap generated successfully.")
    except Exception as e:
        logger.bind(user_id=user_id).warning(f"Step 6 Failed: Roadmap generation error: {e}. Generating default roadmap milestones locally.")
        # Fallback to local default milestones representing gaps to avoid rolling back the transaction
        roadmap_nodes = [
            {
                "skill": gap,
                "priority": "high" if idx == 0 else "medium",
                "effort_weeks": 4,
                "impact_estimate": 85,
                "reason": f"Acquire competence in {gap} to bridge career gaps.",
                "dependencies": [],
                "completionConfidence": 80,
                "projectedImpact": "High compatibility matching adjustment.",
                "strategicRationale": f"Deficit gap detected for {target_role} specialization."
            }
            for idx, gap in enumerate(gaps[:3])
        ]
        if not roadmap_nodes:
            roadmap_nodes = [
                {
                    "skill": "System Architecture Modeling",
                    "priority": "high",
                    "effort_weeks": 4,
                    "impact_estimate": 90,
                    "reason": "Establish baseline system architecture modeling skills.",
                    "dependencies": [],
                    "completionConfidence": 85,
                    "projectedImpact": "High baseline compatibility.",
                    "strategicRationale": "Core career foundations alignment."
                }
            ]

    # 7. Generate real opportunity matches via OpenRouter LLM
    try:
        logger.bind(user_id=user_id).info("Step 7: Generating opportunity matches via OpenRouter...")
        _t7 = time.perf_counter()
        opportunity_matches = await generate_opportunity_matches(
            validated_skills=normalized_skills,
            gaps=gaps,
            specialization=specialization
        )
        _opp_s = time.perf_counter() - _t7
        logger.bind(user_id=user_id, matches_count=len(opportunity_matches)).info(f"[PIPELINE] Opportunity Generation: {_opp_s * 1000:.2f}ms")
    except Exception as e:
        logger.bind(user_id=user_id).warning(f"Step 7 Failed: Opportunity matching generation error: {e}. Falling back to empty opportunity matches.")
        # Fallback gracefully to empty matches rather than rolling back the entire core profile sync
        opportunity_matches = []

    # 8. Legacy sync deferred until after StrategicProfile is persisted (step 9)

    # 9. Build and persist core StrategicProfile to DB
    try:
        logger.bind(user_id=user_id).info("Step 9: Persisting StrategicProfile to DB...")
        _t9 = time.perf_counter()
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
                    "competitiveness_score": trajectory.get("competitiveness_score", 0.80),
                    "skill_origins": {s: "resume" for s in normalized_skills}
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
                "competitiveness_score": trajectory.get("competitiveness_score", 0.80),
                "skill_origins": {s: "resume" for s in normalized_skills}
            }
            profile.calibration_history.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event": "Recalibrated profile metrics via resume updates."
            })
            profile.recruiter_signals = recruiter_signals
            profile.updated_at = datetime.now(timezone.utc)

        # Force flash updates to database session
        await db.flush()
        _persist_s = time.perf_counter() - _t9
        logger.bind(user_id=user_id, event="profile_created").info("profile_created: Strategic career profile created successfully.")
        logger.bind(user_id=user_id).info(f"[PIPELINE] Database Persist: {_persist_s * 1000:.2f}ms")

        try:
            from app.services.strategic_profile_service import (
                sync_legacy_intelligence_from_profile,
                sync_legacy_roadmap_from_profile,
            )
            await sync_legacy_intelligence_from_profile(db, user_id, profile)
            await sync_legacy_roadmap_from_profile(
                db,
                user_id,
                profile,
                milestones=roadmap_nodes,
                focus_areas=gaps[:3],
                coverage=dominant_readiness.get("score", 0.85),
                learning_velocity=trajectory.get("competitiveness_score", 0.80),
            )
            logger.bind(user_id=user_id).info("Legacy intelligence and roadmap tables synced from StrategicProfile.")
        except Exception as e:
            logger.bind(user_id=user_id).warning(f"Legacy profiles sync degraded (non-fatal): {e}")
    except Exception as e:
        logger.bind(user_id=user_id).error(f"Step 9 Failed: StrategicProfile persistence error: {e}")
        raise e

    _pipeline_total_s = time.perf_counter() - _pipeline_start
    logger.bind(user_id=user_id).info(f"[PIPELINE] Total: {_pipeline_total_s * 1000:.2f}ms")
    logger.bind(user_id=user_id).info("Pipeline Execution Complete: Strategic career profile generated successfully.")
    return profile, raw_entities
