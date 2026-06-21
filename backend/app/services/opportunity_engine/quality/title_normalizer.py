"""Title Normalizer — standardizes job titles and filters out non-professional slang."""

import logging
import re
from typing import Tuple

logger = logging.getLogger(__name__)

# Non-professional slang terms that trigger a reject action
GIMMICK_KEYWORDS = [
    r"\bninja\b", r"\bguru\b", r"\bwizard\b", r"\brockstar\b", r"\bcode warrior\b",
    r"\bsuperhero\b", r"\bmagician\b", r"\bchampion\b", r"\bunicorn\b"
]

NORMALIZATION_RULES = [
    # Strip levels
    (r"\b(ii|iii|iv|v|1|2|3|4)\b", ""),
    (r"\b(level|lvl)\s+\d+\b", ""),

    # Normalize common abbreviations
    (r"\binfra\b", "Infrastructure"),
    (r"\beng\b", "Engineer"),
    (r"\bdeveloper\b", "Engineer"),
    (r"\bsoft\b", "Software"),
    (r"\bsre\b", "Site Reliability Engineer"),

    # Clean up multiple whitespaces
    (r"\s+", " "),
]

def clean_and_normalize_title(title: str) -> Tuple[str, bool]:
    """Clean and normalize a job title.

    Returns:
        (normalized_title, is_valid)
    """
    title_clean = title.strip()
    title_lower = title_clean.lower()

    # 1. Reject if title matches any gimmicky/slang terms
    for pattern in GIMMICK_KEYWORDS:
        if re.search(pattern, title_lower):
            logger.info(f"Rejected gimmicky job title: '{title}'")
            return title_clean, False

    # 2. Normalize standard variations
    for pattern, replacement in NORMALIZATION_RULES:
        title_clean = re.sub(pattern, replacement, title_clean, flags=re.IGNORECASE)

    title_clean = title_clean.strip()

    # Clean trailing or leading punctuation/garbage from replacements
    title_clean = re.sub(r"^[\s,\-\|/]+|[\s,\-\|/]+$", "", title_clean)
    title_clean = re.sub(r"\s+", " ", title_clean)

    # If the resulting title is too short or empty, it's invalid
    if len(title_clean) < 3:
        return title.strip(), False

    return title_clean, True
