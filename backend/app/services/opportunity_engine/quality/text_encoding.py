"""Repair common UTF-8 mojibake and detect garbled job listing text."""

import re
import unicodedata
from typing import Optional

MOJIBAKE_MARKERS = ("Ã", "â€", "Â", "æ", "å", "ä", "è", "ï", "¤", "½")

REPLACEMENT_CHAR = "\ufffd"
CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")

KNOWN_TECH_TERMS = frozenset({
    "python", "javascript", "typescript", "react", "node", "nodejs", "java", "go", "golang",
    "rust", "ruby", "php", "swift", "kotlin", "scala", "aws", "azure", "gcp", "docker",
    "kubernetes", "terraform", "redis", "postgres", "postgresql", "mysql", "mongodb",
    "graphql", "django", "flask", "fastapi", "spring", "rails", "vue", "angular",
    "nextjs", "next.js", "tailwind", "linux", "devops", "ci/cd", "kafka", "elasticsearch",
    "pytorch", "tensorflow", "machine learning", "ml", "ai", "llm", "openai",
})


def repair_mojibake(text: str) -> str:
    """Attempt to repair UTF-8 text that was mis-decoded as Latin-1."""
    if not text:
        return text

    stripped = text.strip()
    if not stripped:
        return text

    has_marker = any(marker in stripped for marker in MOJIBAKE_MARKERS)
    if not has_marker:
        return text

    try:
        repaired = stripped.encode("latin-1").decode("utf-8")
        if repaired and repaired != stripped:
            return repaired
    except (UnicodeDecodeError, UnicodeEncodeError):
        pass

    return text


def is_garbled_text(text: str) -> bool:
    """Return True when text is likely corrupted or unreadable."""
    if not text or not text.strip():
        return True

    cleaned = text.strip()

    if REPLACEMENT_CHAR in cleaned:
        return True

    if CONTROL_CHAR_RE.search(cleaned):
        return True

    repaired = repair_mojibake(cleaned)
    if repaired != cleaned:
        # Still has mojibake markers after repair attempt
        if any(marker in repaired for marker in MOJIBAKE_MARKERS):
            return True

    # High ratio of Latin-1 supplement chars often indicates double-encoding failure
    latin_extended = sum(1 for ch in cleaned if "\u0080" <= ch <= "\u00ff")
    if len(cleaned) >= 8 and latin_extended / len(cleaned) > 0.35:
        if any(marker in cleaned for marker in MOJIBAKE_MARKERS):
            return True

    # Reject strings with excessive combining marks / broken normalization
    try:
        normalized = unicodedata.normalize("NFKC", repaired)
        if len(normalized.strip()) < 2:
            return True
    except Exception:
        return True

    return False


def sanitize_job_text_fields(job: dict) -> dict:
    """Repair mojibake on common string fields."""
    cleaned = {**job}
    for field in ("title", "company", "location", "description"):
        value = cleaned.get(field)
        if isinstance(value, str) and value:
            cleaned[field] = repair_mojibake(value)
    return cleaned


def extract_skills_from_description(description: str) -> list[str]:
    """Extract known tech terms from a job description when tags are missing."""
    if not description:
        return []

    text_lower = description.lower()
    found: list[str] = []
    for term in sorted(KNOWN_TECH_TERMS, key=len, reverse=True):
        if term in text_lower and term not in found:
            found.append(term)
    return found[:12]
