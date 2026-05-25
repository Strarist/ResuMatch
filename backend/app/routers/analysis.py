"""Analysis router — HTTP concerns only."""

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user, get_analysis_service
from app.exceptions import NotFoundError
from app.models import User
from app.schemas import AnalyzeRequest, BatchAnalyzeRequest
from app.services import AnalysisService

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
