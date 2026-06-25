"""Response Compressor — sanitizes AI Coach messaging and enforces conciseness rules."""

import logging
import re

logger = logging.getLogger(__name__)

# Jargon mappings to replace engineering theater with professional language
JARGON_REPLACEMENTS = {
    r"\btrajectory\s+vector\b": "career roadmap",
    r"\bsystem\s+runtime\b": "application architecture",
    r"\btelemetry\s+calibration\b": "profile matching",
    r"\borchestration\s+internals\b": "server processes",
    r"\bconvergence\b": "alignment",
    r"\bstrategic\s+storyline\b": "career narrative",
    r"\boperational\s+density\b": "competence depth",
    r"\btrajectory\b": "career goals",
    r"\borchestration\b": "skills",
    r"\btelemetry\b": "learning plan",
    r"\bstrategic\s+vector\b": "opportunities",
    r"\bexecution\s+velocity\b": "interview preparation",
    r"\bcognition\b": "skills",
    r"\bautonomous\s+intelligence\b": "career goals",
    r"\bruntime\b": "architecture",
    r"\bcognitive\s+graph\b": "skill map",
}

def compress_copilot_response(text: str) -> str:
    """Sanitize LLM output to strip sci-fi buzzwords while preserving full response length."""
    if not text or not isinstance(text, str):
        return ""

    sanitized = text
    for pattern, replacement in JARGON_REPLACEMENTS.items():
        sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

    return sanitized.strip()
