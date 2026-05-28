import logging
from typing import Dict, Any
from app.services.llm.analyzers import analyze_resume_text

logger = logging.getLogger(__name__)

async def extract_resume_entities(text: str) -> Dict[str, Any]:
    """Execute LLM text analysis on raw resume string to retrieve structured entity details."""
    logger.info("Triggering LLM resume extraction analyzer.")
    return await analyze_resume_text(text)
