from fastapi import APIRouter
from .endpoints import resume, jobs, auth, analysis

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(resume.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"]) 