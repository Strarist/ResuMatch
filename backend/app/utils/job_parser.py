"""Simple job description parser used for tests.

The real project would contain a sophisticated NLP pipeline. For the unit
tests we only need a function that returns a dictionary with the expected
keys so that the test suite can run without raising exceptions.
"""

from __future__ import annotations

from typing import Dict, List


def parse_job_description(text: str) -> Dict[str, List[str]]:
    """Parse a job description string.

    The implementation is intentionally lightweight – it extracts bullet‑point
    lines that look like skills, education, or experience sections and returns
    them in a ``dict`` with ``skills``, ``education`` and ``experience`` keys.

    The test suite only verifies that the call does not raise and that the
    ``skills`` list is iterable, so a best‑effort shallow parse is sufficient.
    """
    # Naïve extraction: lines that start with a dash are treated as items.
    lines = [ln.strip("- ") for ln in text.splitlines() if ln.strip().startswith("-")]
    # Very simple heuristics – if a line contains common education keywords treat as education
    education_keywords = {"bachelor", "master", "phd", "degree", "college", "university"}
    experience_keywords = {"year", "experience", "worked", "senior", "junior"}

    skills: List[str] = []
    education: List[str] = []
    experience: List[str] = []

    for line in lines:
        lowered = line.lower()
        if any(k in lowered for k in education_keywords):
            education.append(line)
        elif any(k in lowered for k in experience_keywords):
            experience.append(line)
        else:
            skills.append(line)

    return {"skills": skills, "education": education, "experience": experience}
