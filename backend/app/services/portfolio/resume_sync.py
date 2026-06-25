"""Sync parsed resume projects into portfolio evidence records."""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.portfolio.proof_engine import ProjectEvidence, score_project

logger = logging.getLogger(__name__)


async def sync_resume_projects_to_portfolio(
    db: AsyncSession,
    user_id: str,
    raw_entities: dict,
) -> int:
    """Upsert portfolio projects parsed from a resume. Returns number of projects synced."""
    projects = raw_entities.get("projects") or []
    if not isinstance(projects, list) or not projects:
        logger.info("No projects found in resume entities for user %s — skipping portfolio sync", user_id)
        return 0

    existing = await db.execute(
        select(ProjectEvidence).where(ProjectEvidence.user_id == user_id)
    )
    existing_by_name = {
        (p.project_name or "").strip().lower(): p for p in existing.scalars().all()
    }

    synced = 0
    for item in projects:
        if not isinstance(item, dict):
            continue
        name = (item.get("name") or item.get("project_name") or "").strip()
        if not name:
            continue

        stack = item.get("technology_stack") or item.get("stack") or []
        if not isinstance(stack, list):
            stack = []

        description = item.get("description") or ""
        role = item.get("role")
        if role and role not in description:
            description = f"{role}: {description}".strip(": ").strip()

        payload = {
            "project_name": name,
            "description": description or None,
            "stack": stack,
            "github_url": item.get("github_url"),
            "live_url": item.get("live_url"),
            "deployment_platform": None,
            "ci_cd_present": False,
            "dockerized": False,
            "cloud_services_used": [],
            "ai_features_present": False,
            "testing_present": False,
            "documentation_score": 3 if description else 1,
            "architecture_complexity": "intermediate" if len(stack) >= 3 else "basic",
        }
        scores = score_project(payload)
        key = name.lower()

        if key in existing_by_name:
            project = existing_by_name[key]
            project.description = payload["description"]
            project.stack = payload["stack"]
            project.production_readiness_score = scores["production_readiness_score"]
            project.recruiter_signal_strength = scores["recruiter_signal_strength"]
        else:
            project = ProjectEvidence(
                user_id=user_id,
                **payload,
                production_readiness_score=scores["production_readiness_score"],
                recruiter_signal_strength=scores["recruiter_signal_strength"],
            )
            db.add(project)
            existing_by_name[key] = project
        synced += 1

    if synced:
        await db.flush()
        logger.info("Synced %s resume project(s) to portfolio for user %s", synced, user_id)

    return synced
