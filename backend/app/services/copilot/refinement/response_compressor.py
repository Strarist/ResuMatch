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
    """Sanitize LLM output to strip sci-fi buzzwords and strictly clamp paragraph sizes."""
    if not text or not isinstance(text, str):
        return ""

    # 1. Apply professional terminology replacements
    sanitized = text
    for pattern, replacement in JARGON_REPLACEMENTS.items():
        sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

    # 2. Enforce conciseness rules (limit to 3 short paragraphs max)
    paragraphs = [p.strip() for p in sanitized.split("\n\n") if p.strip()]

    if len(paragraphs) > 3:
        logger.info(f"AI Coach response contained {len(paragraphs)} paragraphs. Clamping to 3.")
        # Retain top 3 paragraphs
        clamped_paragraphs = paragraphs[:3]

        # Ensure a graceful closing if clamped
        if not any(clamped_paragraphs[-1].endswith(x) for x in (".", "?", "!")):
            clamped_paragraphs[-1] += "."

        sanitized = "\n\n".join(clamped_paragraphs)

    return sanitized
