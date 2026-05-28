import logging
from typing import Dict, Any
from app.services.llm.provider import llm_service
from app.services.llm.prompts import RESUME_EXTRACTION_SYSTEM, RESUME_EXTRACTION_USER
from app.services.llm.schemas import ResumeExtractionSchema

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
    extracted_json = await llm_service.generate_json(
        messages=messages,
        schema_fallback=fallback_data,
        temperature=0.1
    )

    # Validate against our typesafe Pydantic schema and repair missing/malformed fields
    try:
        validated = ResumeExtractionSchema.model_validate(extracted_json)
        return validated.model_dump()
    except Exception as e:
        logger.error(f"Pydantic validation failed for resume analysis: {e}. Attempting manual recovery.")
        # Attempt minimal parsing recovery or return fallback safely
        return extracted_json if isinstance(extracted_json, dict) else fallback_data
