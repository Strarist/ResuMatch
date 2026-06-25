"""Opportunity Ingestion & Dynamic Matching Engine.

Crawls RemoteOK and Arbeitnow public feeds, filters duplicates, caches responses,
and computes Jaccard overlaps and target specialization alignment scores.
"""

import logging
import traceback
import asyncio
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, TypedDict

from app.models.strategic_profile import StrategicProfile
from app.services.opportunity_engine.scoring.compatibility_score import calculate_compatibility_score
from app.services.opportunity_engine.scoring.market_weighting import calculate_market_demand_weight
from app.services.opportunity_engine.scoring.specialization_matcher import evaluate_specialization_fit
from app.services.opportunity_engine.scoring.recruiter_alignment import evaluate_recruiter_alignment

logger = logging.getLogger(__name__)

JOBS_CACHE_KEY = "opportunity_engine:crawled_jobs"

# In-process crawl deduplication — prevents concurrent 2.5s crawls per request burst
_crawl_lock = asyncio.Lock()
_crawl_memory_jobs: List[Dict[str, Any]] | None = None
_crawl_memory_at: float = 0.0
_CRAWL_MEMORY_TTL_SEC = 300  # 5 minutes

FALLBACK_JOBS = [
    {
        "title": "Senior Staff Full Stack Engineer",
        "company": "Vercel",
        "url": "https://vercel.com/careers",
        "location": "Remote, Global",
        "remote": True,
        "description": "Build high performance Next.js systems and Serverless backend architectures.",
        "tags": ["React", "Next.js", "TypeScript", "Node.js", "GraphQL", "TailwindCSS"],
        "compensation": "$180,000 - $240,000",
        "source": "Vercel Seed"
    },
    {
        "title": "Senior Platform Engineer",
        "company": "Stripe",
        "url": "https://stripe.com/jobs",
        "location": "San Francisco, CA",
        "remote": True,
        "description": "Scale distributed transactional systems, Redis caching infrastructures, and secure API networks.",
        "tags": ["Go", "Kubernetes", "Redis", "Docker", "AWS", "CI/CD", "PostgreSQL"],
        "compensation": "$195,000 - $250,000",
        "source": "Stripe Seed"
    },
    {
        "title": "Staff DevOps Engineer",
        "company": "HashiCorp",
        "url": "https://hashicorp.com/jobs",
        "location": "Remote, US",
        "remote": True,
        "description": "Configure cluster automation pipelines using Terraform and secure Kubernetes ingress.",
        "tags": ["Terraform", "Kubernetes", "Docker", "AWS", "CI/CD", "Linux", "Python"],
        "compensation": "$170,000 - $215,000",
        "source": "HashiCorp Seed"
    },
    {
        "title": "Large Models Infrastructure Lead",
        "company": "Anthropic",
        "url": "https://anthropic.com/careers",
        "location": "San Francisco, CA",
        "remote": False,
        "description": "Orchestrate large cluster GPU pipeline memory layouts and deploy scalable PyTorch models.",
        "tags": ["Python", "PyTorch", "CUDA", "Docker", "Kubernetes", "AWS", "Linux"],
        "compensation": "$220,000 - $310,000",
        "source": "Anthropic Seed"
    },
    {
        "title": "Staff Backend Platform Architect",
        "company": "Supabase",
        "url": "https://supabase.com/careers",
        "location": "Remote, Singapore",
        "remote": True,
        "description": "Design secure realtime PostgreSQL replication layers and build high performance backend APIs.",
        "tags": ["PostgreSQL", "Go", "Docker", "FastAPI", "Redis", "Typescript"],
        "compensation": "$160,000 - $210,000",
        "source": "Supabase Seed"
    }
]


class MatchJobsResult(TypedDict):
    matches: List[Dict[str, Any]]
    degraded: bool
    message: str | None
    match_status: str


def _empty_match_result(degraded: bool = False, message: str | None = None) -> MatchJobsResult:
    return {
        "matches": [],
        "degraded": degraded,
        "message": message,
        "match_status": "degraded" if degraded else "ready",
    }


async def _load_jobs_from_cache() -> List[Dict[str, Any]]:
    """Load crawled jobs from Redis."""
    try:
        from app.services.cache import cache_get
        cached = await cache_get(JOBS_CACHE_KEY)
        if cached and isinstance(cached, list) and cached:
            logger.info("Loading opportunities from Redis cache.")
            return cached
    except Exception as e:
        logger.warning(f"Redis job cache read failed: {e}")
    return []


async def _save_jobs_to_cache(jobs: List[Dict[str, Any]]) -> None:
    """Persist crawled jobs to Redis."""
    try:
        from app.services.cache import cache_set
        await cache_set(JOBS_CACHE_KEY, jobs, "extended")
    except Exception as e:
        logger.warning(f"Redis job cache write failed: {e}")

async def get_crawled_jobs() -> List[Dict[str, Any]]:
    """Retrieve deduplicated, crawled jobs with Redis caching using modular providers."""
    global _crawl_memory_jobs, _crawl_memory_at

    now = time.monotonic()
    if _crawl_memory_jobs and (now - _crawl_memory_at) < _CRAWL_MEMORY_TTL_SEC:
        return _crawl_memory_jobs

    async with _crawl_lock:
        now = time.monotonic()
        if _crawl_memory_jobs and (now - _crawl_memory_at) < _CRAWL_MEMORY_TTL_SEC:
            return _crawl_memory_jobs

        jobs = await _get_crawled_jobs_inner()
        _crawl_memory_jobs = jobs
        _crawl_memory_at = time.monotonic()
        return jobs


async def _get_crawled_jobs_inner() -> List[Dict[str, Any]]:
    """Internal crawl implementation (single-flight via get_crawled_jobs lock)."""
    global _crawl_memory_jobs, _crawl_memory_at

    redis_cached = await _load_jobs_from_cache()
    if redis_cached:
        return redis_cached

    # Crawl live sources concurrently using modular providers
    from app.services.opportunity_engine.providers import get_providers

    providers = get_providers()
    logger.info(f"Triggering concurrent live crawl for {len(providers)} providers with 2.5s timeout.")

    results = []
    try:
        coroutines = [p.fetch_opportunities() for p in providers]
        completed = await asyncio.wait_for(
            asyncio.gather(*coroutines, return_exceptions=True),
            timeout=2.5
        )

        for idx, provider_jobs in enumerate(completed):
            provider = providers[idx]
            if isinstance(provider_jobs, Exception):
                logger.warning(f"Provider {provider.__class__.__name__} raised an exception during crawl: {provider_jobs}")
            elif provider_jobs:
                results.extend(provider_jobs)
    except asyncio.TimeoutError:
        logger.warning("Live crawl timed out after 2.5 seconds.")
    except Exception as e:
        logger.warning(f"Live crawl failed: {e}")

    all_jobs = results
    if not all_jobs:
        if _crawl_memory_jobs and (time.monotonic() - _crawl_memory_at) < _CRAWL_MEMORY_TTL_SEC:
            logger.info("Using in-memory stale job cache after crawl failure.")
            return _crawl_memory_jobs

        logger.warning("Live crawl returned 0 jobs; not substituting seed data.")
        return []

    seen_urls = set()
    deduped = []
    for job in all_jobs:
        url = job.get("url")
        if url not in seen_urls:
            seen_urls.add(url)
            deduped.append(job)

    if results:
        await _save_jobs_to_cache(deduped)

    return deduped

async def match_jobs_for_candidate(profile: StrategicProfile) -> MatchJobsResult:
    """Determine dynamic opportunity alignments using 6-factor intelligence ranking engine."""
    if not profile:
        return _empty_match_result()

    degraded = False
    degraded_message: str | None = None

    try:
        from app.services.opportunity_engine.quality import sanitize_and_rank_opportunities
        crawled_raw = await get_crawled_jobs()
        if not crawled_raw:
            return _empty_match_result(
                degraded=True,
                message="Live opportunity feeds are temporarily unavailable.",
            )
        jobs = sanitize_and_rank_opportunities(crawled_raw)
    except Exception as e:
        logger.error(f"Error during job crawling or quality pipeline: {e}")
        logger.error(traceback.format_exc())
        return _empty_match_result(
            degraded=True,
            message="Opportunity matching failed while loading live feeds.",
        )

    candidate_skills = profile.inferred_skills or []
    target_role = profile.target_role or "Software Engineer"
    specialization = profile.active_specialization or "General"

    # Estimate candidate experience from trajectory_state
    user_exp = 5.0
    if profile.trajectory_state:
        stored_years = profile.trajectory_state.get("years_of_experience")
        if stored_years is not None:
            user_exp = float(stored_years)

    matches = []

    for job in jobs:
        try:
            req_skills = job.get("tags") or job.get("skills") or []
            if not req_skills:
                from app.services.opportunity_engine.quality.text_encoding import extract_skills_from_description
                req_skills = extract_skills_from_description(job.get("description", ""))
            job_title = job.get("title", "")
            job_company = job.get("company", "")
            posted_str = job.get("posted_at")

            # Factor 1: Skill Overlap Compatibility
            comp_score = calculate_compatibility_score(candidate_skills, req_skills)

            # Factor 2: Specialization Fit
            spec_score = evaluate_specialization_fit(specialization, job_title, ", ".join(req_skills))

            # Factor 3: Target Role Fit
            title_lower = job_title.lower()
            role_lower = target_role.lower()
            if role_lower in title_lower or title_lower in role_lower:
                role_score = 1.0
            elif any(w in title_lower for w in role_lower.split()):
                role_score = 0.75
            else:
                role_score = 0.40

            # Factor 4: Experience Fit
            # Heuristically parse job experience requirements
            required_exp = 2.0
            if any(w in title_lower for w in ["lead", "staff", "architect", "principal"]):
                required_exp = 8.0
            elif "senior" in title_lower:
                required_exp = 5.0

            if user_exp >= required_exp:
                exp_score = 1.0
            else:
                exp_score = max(0.3, user_exp / required_exp)

            # Factor 5: Compensation Score (does it align with typical base band?)
            from app.services.opportunity_engine.quality.compensation_parser import (
                parse_compensation,
                compensation_midpoint,
            )
            comp_data = parse_compensation(job.get("compensation", ""))
            job_mid = compensation_midpoint(comp_data)

            # Calculate deviation from standard target salary band ($150k - $210k midpoint $180k)
            target_mid = 180000
            deviation = abs(job_mid - target_mid) / target_mid
            comp_fit_score = max(0.4, 1.0 - deviation)

            # Factor 6: Recency Score
            recency_score = 1.0
            if posted_str:
                try:
                    posted_date = datetime.fromisoformat(posted_str.replace("Z", "+00:00"))
                    delta = datetime.now(timezone.utc) - posted_date
                    if delta.days <= 3:
                        recency_score = 1.0
                    elif delta.days <= 7:
                        recency_score = 0.9
                    elif delta.days <= 14:
                        recency_score = 0.7
                    else:
                        recency_score = 0.5
                except Exception:
                    pass

            # 6-Factor Weighted Scoring Math
            alignment = (
                comp_score * 0.35 +
                spec_score * 0.20 +
                role_score * 0.15 +
                exp_score * 0.10 +
                comp_fit_score * 0.10 +
                recency_score * 0.10
            )
            alignment_pct = int(round(min(1.0, max(0.20, alignment)) * 100))

            # Identify missing gaps
            cand_lower = {s.lower().strip() for s in candidate_skills}
            missing = [s for s in req_skills if s.lower().strip() not in cand_lower]
            missing_lower = {s.lower().strip() for s in missing}
            high_impact_missing = frozenset({"redis", "kubernetes", "terraform", "pytorch"})

            # Calculate missing skills penalties
            penalty = 0
            missing_redis_penalty = False
            for m in missing[:3]:
                if m.lower().strip() in high_impact_missing:
                    penalty += 15
                    missing_redis_penalty = True
                else:
                    penalty += 8

            alignment_pct = max(25, alignment_pct - penalty)

            # Proof Gaps
            proofs = []
            if "kubernetes" in missing_lower:
                proofs.append("Ingress traffic controllers proof")
            if "redis" in missing_lower:
                proofs.append("Distributed caching benchmark proof")
            if not proofs and len(missing) > 0:
                proofs.append(f"{missing[0].title()} demo repository")

            # Explainability reasoning
            reasons = []
            if req_skills:
                reasons.append(f"Matched {len(req_skills) - len(missing)} core technology requirements.")
                if spec_score >= 0.7:
                    reasons.append(f"High specialization overlap ({int(spec_score*100)}%) with your target career track as a {target_role}.")
                if missing_redis_penalty:
                    reasons.append(f"Missing high-impact requirement decreases backend platform alignment by {penalty}%.")
                elif missing:
                    reasons.append(f"Strong overall stack alignment (Missing {len(missing)} requirements: {', '.join(missing[:2])}).")
            else:
                reasons.append("Limited skill metadata from source; score based on role fit, specialization, and recency.")
                if spec_score >= 0.7:
                    reasons.append(f"High specialization overlap ({int(spec_score*100)}%) with your target career track as a {target_role}.")

            alignment_reasoning = " ".join(reasons)

            matches.append({
                "type": "full_time",
                "title": job_title,
                "company": job_company,
                "location": job.get("location", "Remote"),
                "alignment_score": float(alignment_pct / 100.0),
                "match_score": float(alignment_pct),
                "confidence": float(round(comp_score, 2)),
                "estimated_career_impact": "High ($180k+)" if alignment_pct >= 80 else "Medium ($150k+)",
                "matching_signals": [
                    f"Matches target role track as a {target_role}",
                    f"Validates {len(req_skills) - len(missing)} key technologies"
                ],
                "missing_requirements": [m.title() for m in missing[:3]],
                "proof_gaps": proofs[:2],
                "urgency": "high" if alignment_pct >= 85 else "medium" if alignment_pct >= 60 else "low",
                "compensation": job.get("compensation", "$140,000 - $185,000"),
                "recruiterPressure": "high" if alignment_pct >= 80 else "medium",
                "hiringWindow": "Closes in 6 days" if alignment_pct >= 75 else "Closes in 2 weeks",
                "stackCompatibility": ", ".join([t.title() for t in req_skills[:4]]),
                "alignmentReasoning": alignment_reasoning,
                "match_reason": reasons,
                "url": job.get("url"),
                "source": job.get("source") or "Unknown",
                "posted_at": job.get("posted_at"),
                "published_at": job.get("posted_at"),
                "status": "LIVE" if job.get("source") and job.get("source") not in ["Vercel Seed", "Stripe Seed", "HashiCorp Seed", "Anthropic Seed", "Supabase Seed"] else "DEMO",
                "confidence_level": "HIGH" if alignment_pct >= 75 else "MEDIUM" if alignment_pct >= 55 else "LOW",
                "methodology": "6-factor weighted scoring: skill overlap, specialization, role fit, experience, compensation, recency",
                "last_updated": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as je:
            logger.error(f"Error scoring individual job: {je}")
            logger.error(traceback.format_exc())
            continue

    # Sort matches by alignment score
    matches.sort(key=lambda x: x["alignment_score"], reverse=True)
    return {
        "matches": matches[:6],
        "degraded": degraded,
        "message": degraded_message,
        "match_status": "degraded" if degraded else "ready",
    }
