from fastapi import APIRouter

from .auth import router as auth_router
from .resumes import router as resumes_router
from .analysis import router as analysis_router
from .cover_letter import router as cover_letter_router
from .roadmap import router as roadmap_router
from .intelligence import router as intelligence_router
from .roadmap_intel import router as roadmap_intel_router
from .trajectory import router as trajectory_router
from .market_intelligence import router as market_intel_router
from .workspace import router as workspace_router
from .progress import router as progress_router
from .strategic import router as strategic_router
from .portfolio import router as portfolio_router
from .opportunities import router as opportunities_router
from .prediction import router as prediction_router
from .explainability_v2 import router as explainability_v2_router
from .synthesis import router as synthesis_router
from .observability import router as observability_router
from .resilience import router as resilience_router
from .convergence import router as convergence_router

from app.config import get_settings, Environment

settings = get_settings()

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(resumes_router)
api_router.include_router(analysis_router)
api_router.include_router(cover_letter_router)
api_router.include_router(roadmap_router)
api_router.include_router(intelligence_router)
api_router.include_router(roadmap_intel_router)
api_router.include_router(trajectory_router)
api_router.include_router(market_intel_router)
api_router.include_router(workspace_router)
api_router.include_router(progress_router)
api_router.include_router(strategic_router)
api_router.include_router(portfolio_router)
api_router.include_router(opportunities_router)

# Phase 9 research/sandbox APIs — excluded in production to reduce surface area
if settings.env != Environment.production:
    api_router.include_router(prediction_router)
    api_router.include_router(explainability_v2_router)
    api_router.include_router(synthesis_router)
    api_router.include_router(observability_router)
    api_router.include_router(resilience_router)
    api_router.include_router(convergence_router)
