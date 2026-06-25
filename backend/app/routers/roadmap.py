"""Roadmap generation router with SSE streaming."""

import json
import os
from collections.abc import AsyncGenerator
from dataclasses import asdict
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from app.ai.resume_parser import ParsedResume, parse_resume_ai
from app.ai.roadmap import generate_roadmap, stream_roadmap_plan
from app.ai.scoring import score_match
from app.ai.skill_normalization import normalize_skills
from app.ai import AIMessage
from app.ai.provider_factory import get_ai_provider
from app.config import get_settings
from app.core.dependencies import get_current_user, get_resume_repo
from app.models.user import User
from app.repositories import ResumeRepository
from app.sse import sse_event, sse_response

router = APIRouter(prefix="/v1/roadmap", tags=["Roadmap"])


class RoadmapRequest(BaseModel):
    resume_id: UUID
    job_description: str = Field(min_length=10)
    job_title: str = ""


@router.post("/stream")
async def stream_roadmap(
    body: RoadmapRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    resume_repo: ResumeRepository = Depends(get_resume_repo),
):
    """Deprecated — use /v1/roadmap-intel/* instead of legacy SSE roadmap."""

    async def _generate() -> AsyncGenerator[str, None]:
        settings = get_settings()
        resume_id = str(body.resume_id)

        # Load resume
        resume = await resume_repo.get_by_id(body.resume_id, current_user.id)
        if not resume:
            yield sse_event("stream.error", {"error": "Resume not found"})
            return

        # Get parsed data
        if resume.parsed_data and resume.parse_status == "completed":
            parsed = ParsedResume.model_validate(resume.parsed_data)
        else:
            file_path = os.path.join(settings.upload_dir, f"{resume.id}_{resume.filename}")
            if not os.path.exists(file_path):
                yield sse_event("stream.error", {"error": "Resume file not found"})
                return
            parsed = await parse_resume_ai(file_path)
            parsed.skills = normalize_skills(parsed.skills)
            resume.parsed_data = parsed.model_dump()
            resume.skills = parsed.skills
            resume.parse_status = "completed"
            await resume_repo.db.flush()

        yield sse_event("analysis.progress", {
            "resume_id": resume_id, "stage": "matching",
            "progress": 20, "message": "Analyzing skill gaps...",
        })

        # Extract job skills
        provider = get_ai_provider()
        job_data = await provider.generate_json([
            AIMessage(role="system", content='Extract job requirements as JSON: {"skills": [...], "title": "..."}'),
            AIMessage(role="user", content=f"Extract from:\n\n{body.job_description[:5000]}"),
        ], temperature=0.1)

        job_skills = job_data.get("skills", [])

        yield sse_event("analysis.progress", {
            "resume_id": resume_id, "stage": "scoring",
            "progress": 40, "message": f"Found {len(job_skills)} required skills, building roadmap...",
        })

        # Compute match to get missing skills
        result = await score_match(
            resume_skills=parsed.skills, job_skills=job_skills,
            resume_experience=[], job_experience=[],
            resume_education=[], job_education=[],
        )
        missing = result.skill_matching.get("missing_skills", [])

        # Generate roadmap
        roadmap = generate_roadmap(missing, parsed.skills)

        yield sse_event("roadmap.structure", {
            "resume_id": resume_id,
            "milestones": [asdict(m) for m in roadmap.milestones],
            "total_weeks": roadmap.total_weeks,
            "estimated_score_improvement": roadmap.estimated_score_improvement,
        })

        yield sse_event("analysis.progress", {
            "resume_id": resume_id, "stage": "recommendations",
            "progress": 70, "message": "Generating learning plan...",
        })

        # Stream AI learning plan
        async for chunk in stream_roadmap_plan(
            roadmap=roadmap,
            existing_skills=parsed.skills,
            target_role=body.job_title or job_data.get("title", ""),
        ):
            yield sse_event("stream.token", {"content": chunk.content, "done": chunk.done})

    return sse_response(_generate(), request)
