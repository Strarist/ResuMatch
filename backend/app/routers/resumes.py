"""Resume router — HTTP concerns only."""

from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi_limiter.depends import RateLimiter

from app.dependencies import get_current_user, get_resume_service
from app.exceptions import NotFoundError, ValidationError, ExternalServiceError
from app.models import User
from app.schemas import ResumeResponse
from app.services import ResumeService
from app.tasks import process_pdf

router = APIRouter(prefix="/v1/resumes", tags=["Resumes"])


@router.post("", status_code=status.HTTP_202_ACCEPTED, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
):
    file_bytes = await file.read()
    try:
        resume = await resume_service.upload(
            file_bytes=file_bytes, filename=file.filename or "resume.pdf",
            content_type=file.content_type or "", user_id=current_user.id,
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)
    except ExternalServiceError as e:
        raise HTTPException(status_code=500, detail=e.message)

    process_pdf.delay(str(resume.id), f"{resume.id}_{file.filename}")
    return JSONResponse(
        status_code=202,
        content={"message": "Resume upload accepted for processing", "resume_id": str(resume.id)},
    )


@router.get("", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
):
    resumes = await resume_service.list_for_user(current_user.id)
    return {
        "resumes": [
            {**ResumeResponse.model_validate(r).model_dump(), "matches_count": len(r.matches)}
            for r in resumes
        ]
    }


@router.get("/{resume_id}", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def get_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
):
    try:
        resume = await resume_service.get(resume_id, current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    return {"resume": ResumeResponse.model_validate(resume).model_dump()}


@router.delete("/{resume_id}", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def delete_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
):
    try:
        await resume_service.delete(resume_id, current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    return {"message": "Resume deleted successfully"}
