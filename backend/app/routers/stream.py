from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.services.memory_engine.drift_analyzer import drift_engine

router = APIRouter(prefix="/v1/intelligence", tags=["intelligence_stream"])

@router.get("/stream")
async def intelligence_stream():
    """
    SSE endpoint providing continuous adaptive intelligence runtime updates.
    """
    return StreamingResponse(
        drift_engine.generate_drift_stream(),
        media_type="text/event-stream"
    )
