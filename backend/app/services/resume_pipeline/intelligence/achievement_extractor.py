"""Achievement Extractor — parses quantitative metrics and impact phrases from resume text."""

import logging
import re
from typing import List

logger = logging.getLogger(__name__)

# Regular expressions targeting standard metric impact formats:
# e.g., "improved X by 40%", "scaled systems to 10k RPS", "reduced cost by $20,000"
METRIC_PATTERNS = [
    r"(\b(reduced|improved|increased|boosted|cut|saved|scaled)\b.*?(\d+\s*%|\d+\s*k|\$\s*\d+|\d+\s*x))",
    r"(\b\d+\s*%\s*(reduction|increase|improvement|efficiency)\b)",
    r"(\b(team of|led|managed)\s+\d+\b)"
]

def extract_achievements(text: str) -> List[str]:
    """Scan resume text blocks for quantitative, recruiter-credible achievements using heuristic regex rules."""
    lines = text.split("\n")
    extracted = []

    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue

        for pattern in METRIC_PATTERNS:
            match = re.search(pattern, cleaned, flags=re.IGNORECASE)
            if match:
                # Add line bullet to highlights if it meets quality criteria
                if 10 < len(cleaned) < 180:
                    # Clean up bullet markers (+, -, *)
                    clean_highlight = re.sub(r"^[\s\*\-\+\•\.]+", "", cleaned).strip()
                    if clean_highlight not in extracted:
                        extracted.append(clean_highlight)
                        break

    return extracted[:4]
