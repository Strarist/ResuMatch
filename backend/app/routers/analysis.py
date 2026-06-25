"""Analysis router — HTTP + SSE streaming endpoints."""

import asyncio
import os
from collections.abc import AsyncGenerator


from fastapi import APIRouter, Depends, HTTPException, Request

from app.ai.provider_factory import get_ai_provider
from app.ai.resume_parser import parse_resume_ai
from app.ai.scoring import score_match
from app.ai.skill_normalization import normalize_skills
from app.ai.text_extraction import extract_text_from_pdf
from app.ai import AIMessage
from app.config import get_settings
from app.core.dependencies import get_current_user, get_analysis_service, get_resume_repo
from app.exceptions import NotFoundError
from app.models.user import User
from app.models.resume import Resume
from app.repositories import ResumeRepository
from app.schemas import AnalyzeRequest, BatchAnalyzeRequest
from app.services import AnalysisService
from app.sse import sse_event, sse_response

router = APIRouter(prefix="/v1", tags=["Analysis"])


@router.post("/analyze")
async def analyze(
    body: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    """Deprecated — use resume pipeline + /v1/strategic/profile instead."""
    try:
        return await analysis_service.analyze(
            resume_id=body.resume_id, job_description=body.job_description, user_id=current_user.id
        )
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)


@router.post("/analyze/stream")
async def analyze_stream(
    body: AnalyzeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    resume_repo: ResumeRepository = Depends(get_resume_repo),
):
    """SSE streaming endpoint — emits real progress as each pipeline stage completes."""

    async def _generate() -> AsyncGenerator[str, None]:
        resume_id = str(body.resume_id)
        settings = get_settings()

        try:
            # === Stage 1: Validate resume exists ===
            yield sse_event("analysis.progress", {
                "resume_id": resume_id, "stage": "parsing",
                "progress": 5, "message": "Loading resume...",
            })

            resume = await resume_repo.get_by_id(body.resume_id, current_user.id)
            if not resume:
                yield sse_event("analysis.error", {
                    "resume_id": resume_id, "error": "Resume not found", "retryable": False,
                })
                return

            file_path = os.path.join(settings.upload_dir, f"{resume.id}_{resume.filename}")
            if not os.path.exists(file_path):
                yield sse_event("analysis.error", {
                    "resume_id": resume_id, "error": "Resume file not found", "retryable": False,
                })
                return

            # === Stage 2: Parse resume (or use cached) ===
            yield sse_event("analysis.progress", {
                "resume_id": resume_id, "stage": "parsing",
                "progress": 15, "message": "Extracting resume data...",
            })
            await asyncio.sleep(0)

            from app.ai.resume_parser import ParsedResume, ParsedMetadata, ParsedEducation, ParsedExperience
            if resume.parsed_data and resume.parse_status == "completed":
                parsed = ParsedResume.model_validate(resume.parsed_data)
            else:
                from app.services.resume_pipeline.profile_builder import build_and_persist_strategic_profile
                # Trigger the real OpenRouter LLM extraction and strategic profile DB builder pipeline
                profile, raw_entities, _ = await build_and_persist_strategic_profile(resume_repo.db, current_user.id, file_path)

                parsed = ParsedResume(
                    skills=profile.inferred_skills,
                    education=[ParsedEducation(degree=e.get("degree", ""), institution=e.get("institution", ""), year=e.get("year", "")) for e in raw_entities.get("education", []) or []],
                    experience=[ParsedExperience(title=e.get("title", ""), company=e.get("company", ""), duration=e.get("duration", ""), description=e.get("description", "")) for e in raw_entities.get("experience", []) or []],
                    metadata=ParsedMetadata(
                        name=raw_entities.get("metadata", {}).get("name", current_user.name) if raw_entities.get("metadata") else current_user.name,
                        email=raw_entities.get("metadata", {}).get("email", "") if raw_entities.get("metadata") else "",
                        phone=raw_entities.get("metadata", {}).get("phone", "") if raw_entities.get("metadata") else "",
                        location=raw_entities.get("metadata", {}).get("location", "") if raw_entities.get("metadata") else ""
                    )
                )
                resume.parsed_data = raw_entities
                resume.skills = parsed.skills
                resume.parse_status = "completed"
                await resume_repo.db.flush()

            yield sse_event("analysis.progress", {
                "resume_id": resume_id, "stage": "parsing",
                "progress": 35, "message": f"Found {len(parsed.skills)} skills, {len(parsed.experience)} roles",
            })
            await asyncio.sleep(0)

            # === Stage 3: Parse job description ===
            yield sse_event("analysis.progress", {
                "resume_id": resume_id, "stage": "matching",
                "progress": 45, "message": "Analyzing job requirements...",
            })

            provider = get_ai_provider()
            job_data = await provider.generate_json([
                AIMessage(role="system", content='Extract job requirements as JSON: {"skills": [...], "education": [...], "experience": [...], "title": "..."}'),
                AIMessage(role="user", content=f"Extract requirements from:\n\n{body.job_description[:10000]}"),
            ], temperature=0.1)

            yield sse_event("analysis.progress", {
                "resume_id": resume_id, "stage": "matching",
                "progress": 60, "message": f"Found {len(job_data.get('skills', []))} required skills",
            })
            await asyncio.sleep(0)

            # === Stage 4: Score match ===
            yield sse_event("analysis.progress", {
                "resume_id": resume_id, "stage": "scoring",
                "progress": 75, "message": "Computing semantic match scores...",
            })

            result = await score_match(
                resume_skills=parsed.skills,
                job_skills=job_data.get("skills", []),
                resume_experience=[e.model_dump() for e in parsed.experience],
                job_experience=job_data.get("experience", []),
                resume_education=[e.model_dump() for e in parsed.education],
                job_education=job_data.get("education", []),
                resume_titles=[e.title for e in parsed.experience],
                job_title=job_data.get("title", ""),
            )

            yield sse_event("analysis.progress", {
                "resume_id": resume_id, "stage": "recommendations",
                "progress": 90, "message": "Generating recommendations...",
            })
            await asyncio.sleep(0)

            # === Stage 5: Complete ===
            yield sse_event("analysis.complete", {
                "resume_id": resume_id,
                "overall_score": result.overall_score,
                "confidence": result.confidence,
                "skills_score": round(result.signals[0].score * 100, 1),
                "experience_score": round(result.signals[1].score * 100, 1),
                "education_score": round(result.signals[2].score * 100, 1),
                "seniority_score": round(result.signals[3].score * 100, 1),
                "explanations": {s.name: s.explanation for s in result.signals},
                "skill_matching": result.skill_matching,
                "recommendations": result.recommendations,
            })

        except Exception as e:
            yield sse_event("analysis.error", {
                "resume_id": resume_id, "error": str(e)[:200], "retryable": True,
            })

    return sse_response(_generate(), request)


@router.post("/analyze/batch")
async def analyze_batch(
    body: BatchAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    try:
        return await analysis_service.analyze_batch(
            resume_id=body.resume_id, job_descriptions=body.job_descriptions, user_id=current_user.id
        )
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
