"""Section Mapper — parses and maps lines of resume text to structured section blocks."""

import logging
import re
from typing import Dict, List

logger = logging.getLogger(__name__)

SECTION_HEADERS = {
    "experience": [
        r"\bexperience\b", r"\bemployment\b", r"\bwork history\b", r"\bcareer history\b",
        r"\bprofessional background\b", r"\bwork experience\b"
    ],
    "projects": [
        r"\bprojects\b", r"\btechnical projects\b", r"\bportfolio projects\b", r"\bkey projects\b"
    ],
    "skills": [
        r"\bskills\b", r"\btechnical skills\b", r"\bcompetencies\b", r"\bcore competencies\b",
        r"\btechnologies\b", r"\bareas of expertise\b"
    ],
    "education": [
        r"\beducation\b", r"\bacademic background\b", r"\bacademics\b", r"\buniversity\b"
    ],
    "certifications": [
        r"\bcertifications\b", r"\bcertificates\b", r"\bcredentials\b", r"\bprofessional credentials\b"
    ]
}

def map_text_to_sections(raw_text: str) -> Dict[str, str]:
    """Parse raw resume text and partition it into logical section blocks using regex heuristics."""
    lines = raw_text.split("\n")
    current_section = "metadata"  # Default section for top header content

    sections_content: Dict[str, List[str]] = {
        "metadata": [],
        "experience": [],
        "projects": [],
        "skills": [],
        "education": [],
        "certifications": []
    }

    for line in lines:
        cleaned_line = line.strip()
        if not cleaned_line:
            continue

        # Detect section changes based on headers
        header_detected = False
        for sec_name, regexes in SECTION_HEADERS.items():
            for regex in regexes:
                # Require header to be short and match exactly
                if re.search(regex, cleaned_line.lower()) and len(cleaned_line) < 35:
                    current_section = sec_name
                    header_detected = True
                    break
            if header_detected:
                break

        if header_detected:
            continue

        sections_content[current_section].append(line)

    # Reconstitute raw text blocks
    return {k: "\n".join(v).strip() for k, v in sections_content.items()}
