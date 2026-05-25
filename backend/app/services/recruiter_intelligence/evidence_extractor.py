"""Evidence extraction — deterministic pattern matching for recruiter signals."""

import re

_IMPACT_PATTERNS = [
    re.compile(r"(?:reduced|improved|increased|decreased|optimized).*?(\d+%)", re.I),
    re.compile(r"(\d+x)\s+(?:faster|improvement|reduction)", re.I),
    re.compile(r"(?:saved|reduced).*?(\$[\d,]+|\d+\s*hours)", re.I),
]

_LEADERSHIP_PATTERNS = [
    re.compile(r"(?:led|managed|mentored|supervised)\s+(?:a\s+)?(?:team\s+of\s+)?(\d+)", re.I),
    re.compile(r"(?:cross-functional|cross functional)\s+(?:team|collaboration)", re.I),
    re.compile(r"(?:hired|recruited|onboarded)\s+(\d+)", re.I),
]

_ARCHITECTURE_PATTERNS = [
    re.compile(r"(?:designed|architected|built)\s+(?:a\s+)?(?:distributed|scalable|microservice)", re.I),
    re.compile(r"system\s+design", re.I),
    re.compile(r"(?:event[- ]driven|message[- ]queue|pub[/]?sub)", re.I),
]

_DEPLOYMENT_PATTERNS = [
    re.compile(r"(?:deployed|shipped)\s+to\s+production", re.I),
    re.compile(r"CI/CD|continuous\s+(?:integration|deployment)", re.I),
    re.compile(r"(?:kubernetes|docker|terraform)\s+(?:in\s+)?production", re.I),
]


def extract_evidence(text: str) -> dict:
    """Extract recruiter-relevant evidence from resume/experience text.

    Returns:
        {
            "impact_metrics": [str],
            "leadership_signals": [str],
            "architecture_signals": [str],
            "deployment_signals": [str],
        }
    """
    return {
        "impact_metrics": _find_all(_IMPACT_PATTERNS, text),
        "leadership_signals": _find_all(_LEADERSHIP_PATTERNS, text),
        "architecture_signals": _find_all(_ARCHITECTURE_PATTERNS, text),
        "deployment_signals": _find_all(_DEPLOYMENT_PATTERNS, text),
    }


def _find_all(patterns: list[re.Pattern], text: str) -> list[str]:
    results = []
    for pattern in patterns:
        for match in pattern.finditer(text):
            # Get surrounding context (±40 chars)
            start = max(0, match.start() - 20)
            end = min(len(text), match.end() + 20)
            results.append(text[start:end].strip())
    return results[:5]  # Cap at 5 per category
