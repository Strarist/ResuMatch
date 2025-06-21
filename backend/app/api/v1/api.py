import logging
logging.warning('api.py imported and routers being included...')

from fastapi import APIRouter

from app.api.v1.endpoints import auth, resumes, jobs, matches, dashboard

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(matches.router, prefix="/matches", tags=["matches"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"]) 