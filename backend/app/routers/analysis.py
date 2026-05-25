"""Analysis router — HTTP concerns only."""

import asyncio
from collections.abc import AsyncGenerator
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request

from app.dependencies import get_current_user, get_analysis_service
from app.exceptions import NotFoundError
from app.models import User
from app.schemas import AnalyzeRequest, BatchAnalyzeRequest
from app.services import AnalysisService
from app.sse import sse_event, sse_response, heartbeat_event

router = APIRouter(prefix="/v1", tags=["Analysis"])


@router.post("/analyze")
async def analyze(
    body: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
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
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    """SSE streaming endpoint for real-time analysis progress."""

    async def _generate() -> AsyncGenerator[str, None]:
        resume_id = str(body.resume_id)

        try:
            # Stage 1: Parsing
            yield sse_event("analysis.progress", {
                "resume_id": resume_id, "stage": "parsing",
                "progress": 10, "message": "Parsing resume...",
            })

            result = await analysis_service.analyze(
                resume_id=body.resume_id,
                job_description=body.job_description,
                user_id=current_user.id,
            )

            # Stage 2: Matching
            yield sse_event("analysis.progress", {
                "resume_id": resume_id, "stage": "matching",
                "progress": 50, "message": "Matching skills...",
            })
            await asyncio.sleep(0)  # yield control for disconnect check

            # Stage 3: Scoring
            yield sse_event("analysis.progress", {
                "resume_id": resume_id, "stage": "scoring",
                "progress": 80, "message": "Calculating scores...",
            })

            # Stage 4: Complete
            yield sse_event("analysis.complete", {
                "resume_id": resume_id,
                "overall_score": result["overall_match_score"],
                "skills_score": result["detailed_scores"]["skills_score"],
                "experience_score": result["detailed_scores"]["experience_score"],
                "education_score": result["detailed_scores"]["education_score"],
            })

        except NotFoundError as e:
            yield sse_event("analysis.error", {
                "resume_id": resume_id, "error": e.message, "retryable": False,
            })
        except Exception:
            yield sse_event("analysis.error", {
                "resume_id": resume_id, "error": "Analysis failed", "retryable": True,
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
