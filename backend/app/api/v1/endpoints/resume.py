from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List
from sqlalchemy.orm import Session
from ....core.config import settings
from ....schemas.resume import ResumeCreate, ResumeResponse, ResumeUpdate, ResumeList
from ....services.resume import ResumeService
from ....services.auth import get_current_user
from ....db.session import get_db

router = APIRouter()

@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a resume file and process it
    """
    if not file.filename.endswith(('.pdf', '.doc', '.docx')):
        raise HTTPException(
            status_code=400,
            detail="Only PDF and Word documents are allowed"
        )
    
    try:
        resume_service = ResumeService(db)
        resume = await resume_service.process_resume_upload(file, current_user.id)
        return resume
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=ResumeList)
async def list_resumes(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """
    List all resumes for the current user
    """
    try:
        resume_service = ResumeService(db)
        resumes = await resume_service.get_user_resumes(
            user_id=current_user.id,
            skip=skip,
            limit=limit
        )
        return {"items": resumes, "total": len(resumes)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific resume by ID
    """
    try:
        resume_service = ResumeService(db)
        resume = await resume_service.get_resume(resume_id, current_user.id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        return resume
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a resume
    """
    try:
        resume_service = ResumeService(db)
        success = await resume_service.delete_resume(resume_id, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Resume not found")
        return JSONResponse(content={"message": "Resume deleted successfully"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 