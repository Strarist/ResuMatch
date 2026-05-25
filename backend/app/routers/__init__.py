from fastapi import APIRouter

from .auth import router as auth_router
from .resumes import router as resumes_router
from .analysis import router as analysis_router
from .matches import router as matches_router
from .cover_letter import router as cover_letter_router
from .roadmap import router as roadmap_router
from .intelligence import router as intelligence_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(resumes_router)
api_router.include_router(analysis_router)
api_router.include_router(matches_router)
api_router.include_router(cover_letter_router)
api_router.include_router(roadmap_router)
api_router.include_router(intelligence_router)
