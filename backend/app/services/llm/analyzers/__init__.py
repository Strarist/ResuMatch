import logging
from typing import Dict, Any
from app.services.llm.provider import llm_service
from app.services.llm.prompts import RESUME_EXTRACTION_SYSTEM, RESUME_EXTRACTION_USER
from app.services.llm.schemas import ResumeExtractionSchema
from app.services.llm.validators.json_validator import validate_and_repair_json

logger = logging.getLogger(__name__)

async def analyze_resume_text(text: str) -> Dict[str, Any]:
    """Analyze raw resume text via OpenRouter to extract high-fidelity structured data."""
    fallback_data = {
        "skills": [],
        "education": [],
        "experience": [],
        "projects": [],
        "metadata": {"name": "", "email": "", "phone": "", "location": ""},
        "inferred_specialization": "Software Engineering",
        "inferred_target_role": "Senior Developer",
        "years_of_experience": 0.0,
        "certifications": []
    }

    messages = [
        {"role": "system", "content": RESUME_EXTRACTION_SYSTEM},
        {"role": "user", "content": RESUME_EXTRACTION_USER.format(text=text[:15000])}
    ]

    logger.info("Executing OpenRouter resume analysis...")
    try:
        raw_output = await llm_service.generate(messages, temperature=0.1)
        result_json = validate_and_repair_json(raw_output, ResumeExtractionSchema, fallback_data)
        validated = ResumeExtractionSchema.model_validate(result_json)
        return validated.model_dump()
    except Exception as e:
        logger.error(f"Structured validation failed for resume analysis: {e}. Returning fallback schema.")
        return fallback_data
