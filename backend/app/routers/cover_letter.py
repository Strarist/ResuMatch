"""Cover letter generation router with SSE streaming."""

import os
from collections.abc import AsyncGenerator
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.ai.cover_letter import Tone, stream_cover_letter
from app.ai.resume_parser import ParsedResume
from app.ai.skill_normalization import normalize_skills
from app.ai.resume_parser import parse_resume_ai
from app.config import get_settings
from app.core.dependencies import get_current_user, get_resume_repo
from app.models.user import User
from app.repositories import ResumeRepository
from app.sse import sse_event, sse_response

router = APIRouter(prefix="/v1/cover-letter", tags=["Cover Letter"])


class CoverLetterRequest(BaseModel):
    resume_id: UUID
    job_description: str = Field(min_length=10)
    job_title: str = ""
    company: str = ""
    tone: Tone = Tone.professional


@router.post("/stream")
async def stream_cover_letter_endpoint(
    body: CoverLetterRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    resume_repo: ResumeRepository = Depends(get_resume_repo),
):
    """Stream cover letter generation token by token via SSE."""

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
            await resume_repo.db.commit()

        yield sse_event("stream.token", {"content": "", "done": False})

        # Stream the cover letter
        try:
            async for chunk in stream_cover_letter(
                parsed=parsed,
                job_description=body.job_description,
                job_title=body.job_title,
                company=body.company,
                tone=body.tone,
            ):
                yield sse_event("stream.token", {"content": chunk.content, "done": chunk.done})
        except Exception as e:
            yield sse_event("stream.error", {"error": str(e)[:200]})

    return sse_response(_generate(), request)
