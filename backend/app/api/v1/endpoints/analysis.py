from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Dict
from app.api.deps import get_current_user
from app.models.user import User
from app.services.resume_parser import ResumeParser
from app.schemas.resume import ResumeAnalysisResponse

router = APIRouter()

@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    file_path: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
) -> ResumeAnalysisResponse:
    """Analyze a resume and extract structured data"""
    try:
        parser = ResumeParser()
        analysis_result = parser.parse_resume(file_path)
        
        return ResumeAnalysisResponse(
            success=True,
            data=analysis_result,
            message="Resume analyzed successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis/ping")
def ping() -> Dict[str, str]:
    return {"message": "analysis endpoint available"} 