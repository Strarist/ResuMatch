"""Opportunities API — matches, gaps, radar."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.logger import logger
from app.models.user import User
from app.services.opportunities.normalize import normalize_opportunity_match
from app.services.opportunities import compute_opportunity_gaps, compute_opportunity_radar
import time
import traceback
from app.services.portfolio.recruiter_engine import compute_recruiter_profile
from app.services.portfolio.proof_engine import ProjectEvidence
from app.services.intelligence.orchestrator import get_intelligence_summary_readonly
from app.services.execution import compute_execution_profile
from app.services.roadmap_intel import RoadmapRepository
from app.services.workspace import WorkspaceRepository

router = APIRouter(prefix="/v1/opportunities", tags=["Opportunities"])

_DEMO_SOURCES = frozenset({
    "Vercel Seed", "Stripe Seed", "HashiCorp Seed", "Anthropic Seed", "Supabase Seed",
})


def _ensure_match_trust_fields(match: dict) -> dict:
    """Normalize persisted or cached matches with explicit trust metadata."""
    normalized = normalize_opportunity_match(match)

    source = normalized.get("source") or "StrategicProfile"
    reasons = normalized.get("match_reason")
    if not reasons:
        alt = normalized.get("alignmentReasoning") or normalized.get("alignment_reasoning") or normalized.get("matching_signals")
        reasons = alt if isinstance(alt, list) else ([str(alt)] if alt else [])
    normalized["match_reason"] = reasons
    normalized["source"] = source
    if "published_at" not in normalized:
        normalized["published_at"] = normalized.get("posted_at")
    if "status" not in normalized:
        normalized["status"] = (
            "DEMO" if source in _DEMO_SOURCES or "Seed" in str(source) else "LIVE"
        )
    return normalized


def _matches_response(
    matches: list,
    status: str,
    message: str | None = None,
    *,
    degraded: bool | None = None,
    match_status: str | None = None,
) -> dict:
    res = {
        "matches": [_ensure_match_trust_fields(m) for m in matches],
        "status": status,
        "match_status": match_status or ("degraded" if degraded or status == "degraded" else "ready"),
        "degraded": bool(degraded) if degraded is not None else status == "degraded",
    }
    if message:
        res["message"] = message
    return res


async def _build_context(user_id: str, db: AsyncSession):
    """Shared context builder for opportunity endpoints (read-only, no DB writes)."""
    intel = await get_intelligence_summary_readonly(db, user_id)
    trajectory = intel["trajectory"]
    market = intel["market"]

    roadmap_repo = RoadmapRepository(db)
    workspace_repo = WorkspaceRepository(db)
    roadmap = await roadmap_repo.get_active(user_id)
    actions = await workspace_repo.get_actions(user_id)

    execution = compute_execution_profile(
        completed_nodes=(roadmap.completed_nodes or []) if roadmap else [],
        deferred_nodes=(roadmap.deferred_nodes or []) if roadmap else [],
        recommendation_actions=[{"action": a.action} for a in actions],
        operational_events=[], roadmap_version=roadmap.roadmap_version if roadmap else 0,
        growth_velocity=intel["summary"].get("competitiveness", 0),
        last_upload_at=None, last_activity_at=None,
    )

    result = await db.execute(select(ProjectEvidence).where(ProjectEvidence.user_id == user_id))
    projects = [{"project_name": p.project_name, "live_url": p.live_url, "deployment_platform": p.deployment_platform,
                 "ci_cd_present": p.ci_cd_present, "dockerized": p.dockerized, "cloud_services_used": p.cloud_services_used,
                 "ai_features_present": p.ai_features_present, "testing_present": p.testing_present,
                 "documentation_score": p.documentation_score, "architecture_complexity": p.architecture_complexity}
                for p in result.scalars().all()]

    recruiter = compute_recruiter_profile(trajectory=trajectory, execution_profile=execution,
                                          portfolio_projects=projects, market=market,
                                          user_skills=list(trajectory.get("specializations", {}).keys()))

    return trajectory, market, execution, recruiter


from app.services.cache import cache_get, cache_set

@router.get("/matches")
async def get_opportunity_matches(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t_start = time.perf_counter()
    try:
        cache_key = f"opportunities:matches:{current_user.id}"
        cached = await cache_get(cache_key)
        if cached:
            if cached.get("matches"):
                cached = _matches_response(cached["matches"], cached.get("status", "ready"), cached.get("message"))
            t_total = (time.perf_counter() - t_start) * 1000
            logger.info(f"[MATCHES] Total={t_total:.2f}ms (Cached)")
            return cached

        t0 = time.perf_counter()
        from app.services.strategic_profile_service import get_strategic_profile

        profile = await get_strategic_profile(db, current_user.id)
        dt_db = (time.perf_counter() - t0) * 1000
        logger.info(f"[MATCHES] Database={dt_db:.2f}ms")

        if profile:
            if profile.opportunity_alignment:
                feed_meta = (profile.trajectory_state or {}).get("opportunity_feed", {})
                degraded = bool(feed_meta.get("degraded"))
                status = "degraded" if degraded else "ready"
                message = feed_meta.get("message")
                res = _matches_response(
                    profile.opportunity_alignment,
                    status,
                    message,
                    degraded=degraded,
                )
                await cache_set(cache_key, res, "medium")
                t_total = (time.perf_counter() - t_start) * 1000
                logger.info(f"[MATCHES] Total={t_total:.2f}ms (Profile cache)")
                return res

            res = _matches_response(
                [],
                "pending",
                "Opportunity matching will populate after profile calibration completes.",
            )
            await cache_set(cache_key, res, "short")
            t_total = (time.perf_counter() - t_start) * 1000
            logger.info(f"[MATCHES] Total={t_total:.2f}ms (Pending — no crawl on GET)")
            return res

        t0 = time.perf_counter()
        res = _matches_response(
            [],
            "pending",
            "Upload a resume to generate opportunity matches.",
        )
        await cache_set(cache_key, res, "short")
        dt_serialization = (time.perf_counter() - t0) * 1000
        logger.info(f"[MATCHES] Serialization={dt_serialization:.2f}ms")

        t_total = (time.perf_counter() - t_start) * 1000
        logger.info(f"[MATCHES] Total={t_total:.2f}ms (No profile)")
        return res
    except Exception as e:
        logger.error(f"[OPPORTUNITIES MATCHES] Unexpected error: {e}")
        logger.error(traceback.format_exc())
        raise


@router.get("/gaps")
async def get_opportunity_gaps(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t_start = time.perf_counter()
    try:
        cache_key = f"opportunities:gaps:{current_user.id}"
        cached = await cache_get(cache_key)
        if cached:
            t_total = (time.perf_counter() - t_start) * 1000
            logger.info(f"[GAPS] Total={t_total:.2f}ms (Cached)")
            return cached

        t0 = time.perf_counter()
        from app.services.strategic_profile_service import get_strategic_profile
        profile = await get_strategic_profile(db, current_user.id)
        dt_db = (time.perf_counter() - t0) * 1000
        logger.info(f"[GAPS] Database={dt_db:.2f}ms")

        if profile and profile.recruiter_signals:
            t0 = time.perf_counter()
            fit = profile.recruiter_signals.get("roleFit", [])
            gaps = []
            for f in fit:
                gaps.append({
                    "target_role": f["role"],
                    "readiness_percentage": round(f["proofAdjusted"] * 100, 1),
                    "skill_readiness": round(f["skillReadiness"] * 100, 1),
                    "missing_skills": f["missing"][:3],
                    "missing_proof": [r.replace("Deficit gap detected: ", "") for r in profile.recruiter_signals.get("hiringRisks", [])][:2],
                    "estimated_completion_time": f"{max(1, len(f['missing']) * 3)} weeks" if f["missing"] else "Ready",
                    "recruiter_impact": "high"
                })
            dt_analysis = (time.perf_counter() - t0) * 1000
            logger.info(f"[GAPS] Analysis={dt_analysis:.2f}ms")

            t0 = time.perf_counter()
            res = {"gaps": gaps}
            await cache_set(cache_key, res, "medium")
            dt_serialization = (time.perf_counter() - t0) * 1000
            logger.info(f"[GAPS] Serialization={dt_serialization:.2f}ms")

            t_total = (time.perf_counter() - t_start) * 1000
            logger.info(f"[GAPS] Total={t_total:.2f}ms")
            return res

        t0 = time.perf_counter()
        trajectory, _, _, recruiter = await _build_context(current_user.id, db)
        dt_context = (time.perf_counter() - t0) * 1000
        logger.info(f"[GAPS] Context Build={dt_context:.2f}ms")

        t0 = time.perf_counter()
        gaps = compute_opportunity_gaps(trajectory, recruiter)
        dt_analysis = (time.perf_counter() - t0) * 1000
        logger.info(f"[GAPS] Analysis={dt_analysis:.2f}ms")

        t0 = time.perf_counter()
        res = {"gaps": gaps}
        await cache_set(cache_key, res, "medium")
        dt_serialization = (time.perf_counter() - t0) * 1000
        logger.info(f"[GAPS] Serialization={dt_serialization:.2f}ms")

        t_total = (time.perf_counter() - t_start) * 1000
        logger.info(f"[GAPS] Total={t_total:.2f}ms")
        return res
    except Exception as e:
        logger.error(f"[OPPORTUNITIES GAPS] Unexpected error: {e}")
        logger.error(traceback.format_exc())
        raise


@router.get("/radar")
async def get_opportunity_radar(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t_start = time.perf_counter()
    try:
        cache_key = f"opportunities:radar:{current_user.id}"
        cached = await cache_get(cache_key)
        if cached:
            t_total = (time.perf_counter() - t_start) * 1000
            logger.info(f"[RADAR] Total={t_total:.2f}ms (Cached)")
            return cached

        t0 = time.perf_counter()
        from app.services.market_intelligence import compute_market_intelligence
        from app.services.strategic_profile_service import get_profile_context

        ctx = await get_profile_context(db, current_user.id)
        if ctx["has_profile"] and ctx["profile"]:
            trajectory = ctx["profile"].trajectory_state or {}
            market = compute_market_intelligence(
                user_skills=ctx["skills"],
                skill_confidences=ctx["skill_confidences"],
                target_role=ctx["target_role"],
                seniority=ctx["seniority"],
                growth_velocity=ctx["growth_velocity"],
            )
            execution = compute_execution_profile(
                completed_nodes=[], deferred_nodes=[], recommendation_actions=[],
                operational_events=[], roadmap_version=0,
                growth_velocity=ctx["growth_velocity"],
                last_upload_at=None, last_activity_at=None,
            )
            dt_context = (time.perf_counter() - t0) * 1000
            logger.info(f"[RADAR] Profile context={dt_context:.2f}ms")
        else:
            trajectory, market, execution, _ = await _build_context(current_user.id, db)
            dt_context = (time.perf_counter() - t0) * 1000
            logger.info(f"[RADAR] Context Build={dt_context:.2f}ms")

        t0 = time.perf_counter()
        res = compute_opportunity_radar(trajectory, market, execution)
        dt_analytics = (time.perf_counter() - t0) * 1000
        logger.info(f"[RADAR] Analytics={dt_analytics:.2f}ms")

        t0 = time.perf_counter()
        await cache_set(cache_key, res, "medium")
        dt_serialization = (time.perf_counter() - t0) * 1000
        logger.info(f"[RADAR] Serialization={dt_serialization:.2f}ms")

        t_total = (time.perf_counter() - t_start) * 1000
        logger.info(f"[RADAR] Total={t_total:.2f}ms")
        return res
    except Exception as e:
        logger.error(f"[OPPORTUNITIES RADAR] Unexpected error: {e}")
        logger.error(traceback.format_exc())
        raise
