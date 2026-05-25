"""AI-powered resume parsing service.

Pipeline: PDF → text extraction → AI structured parsing → schema validation → normalization.
"""

import logging
from pydantic import BaseModel, Field, ValidationError

from app.ai import AIMessage, AIProvider, AIProviderError
from app.ai.provider_factory import get_ai_provider
from app.ai.text_extraction import extract_text_from_pdf
from app.ai.prompts import RESUME_PARSE_SYSTEM, RESUME_PARSE_USER

logger = logging.getLogger(__name__)

MAX_RETRIES = 2


# === Parsed Resume Schema ===


class ParsedEducation(BaseModel):
    degree: str = ""
    institution: str = ""
    year: str = ""


class ParsedExperience(BaseModel):
    title: str = ""
    company: str = ""
    duration: str = ""
    description: str = ""


class ParsedMetadata(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""


class ParsedResume(BaseModel):
    """Validated schema for AI-parsed resume output."""
    skills: list[str] = Field(default_factory=list)
    education: list[ParsedEducation] = Field(default_factory=list)
    experience: list[ParsedExperience] = Field(default_factory=list)
    metadata: ParsedMetadata = Field(default_factory=ParsedMetadata)


# === Parsing Service ===


async def parse_resume_ai(file_path: str, provider: AIProvider | None = None) -> ParsedResume:
    """Parse a resume PDF into structured data using AI.

    1. Extract text from PDF
    2. Send to AI provider with structured output prompt
    3. Validate response against ParsedResume schema
    4. Retry on malformed output (up to MAX_RETRIES)
    """
    text = extract_text_from_pdf(file_path)
    if not provider:
        provider = get_ai_provider()

    messages = [
        AIMessage(role="system", content=RESUME_PARSE_SYSTEM),
        AIMessage(role="user", content=RESUME_PARSE_USER.format(resume_text=text[:15000])),
    ]

    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            raw = await provider.generate_json(messages, temperature=0.1)
            return _validate_and_repair(raw)
        except ValidationError as e:
            last_error = e
            logger.warning(f"Resume parse validation failed (attempt {attempt + 1}): {e}")
        except AIProviderError as e:
            last_error = e
            if not e.retryable:
                break
            logger.warning(f"AI provider error (attempt {attempt + 1}): {e.message}")

    logger.error(f"Resume parsing failed after {MAX_RETRIES + 1} attempts: {last_error}")
    return ParsedResume()  # Return empty rather than crash


def _validate_and_repair(raw: dict) -> ParsedResume:
    """Validate AI output, repair common issues."""
    # Handle case where AI wraps in extra key
    if "resume" in raw and isinstance(raw["resume"], dict):
        raw = raw["resume"]

    # Ensure skills is a list of strings (AI sometimes returns objects)
    if "skills" in raw and isinstance(raw["skills"], list):
        raw["skills"] = [
            s if isinstance(s, str) else s.get("name", str(s))
            for s in raw["skills"]
        ]

    return ParsedResume.model_validate(raw)
