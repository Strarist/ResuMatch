"""Resume router — HTTP concerns only."""

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse

from app.core.dependencies import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_current_user, get_resume_service
from app.exceptions import NotFoundError, ValidationError, ExternalServiceError
from app.models.user import User
from app.schemas import ResumeResponse
from app.services import ResumeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/resumes", tags=["Resumes"])


async def _process_resume_background(resume_id: str, filename: str) -> None:
    """Background task placeholder for post-upload processing.

    In the future this will trigger skill extraction via the AI pipeline.
    Currently a no-op since parsing happens synchronously during /analyze.
    """
    logger.info(f"Background processing queued for resume {resume_id} ({filename})")


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
    db: AsyncSession = Depends(get_db),
):
    file_bytes = await file.read()
    try:
        resume = await resume_service.upload(
            file_bytes=file_bytes, filename=file.filename or "resume.pdf",
            content_type=file.content_type or "", user_id=current_user.id,
        )
        from app.services.user_progress_service import track_resume_upload
        await track_resume_upload(db, current_user.id, file.filename or "resume.pdf")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)
    except ExternalServiceError as e:
        raise HTTPException(status_code=500, detail=e.message)
    await db.commit()

    background_tasks.add_task(_process_resume_background, resume.id, resume.filename)
    return JSONResponse(
        status_code=202,
        content={"message": "Resume upload accepted for processing", "resume_id": str(resume.id)},
    )


@router.get("")
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


@router.get("/{resume_id}")
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
):
    try:
        resume = await resume_service.get(resume_id, current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    return {"resume": ResumeResponse.model_validate(resume).model_dump()}


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await resume_service.delete(resume_id, current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    await db.commit()
    return {"message": "Resume deleted successfully"}
