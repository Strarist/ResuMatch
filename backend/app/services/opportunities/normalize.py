"""Normalize opportunity match payloads to a stable snake_case API contract."""

from __future__ import annotations


def normalize_alignment_score(match: dict) -> float | None:
    raw = match.get("alignment_score")
    if raw is None:
        raw = match.get("alignmentScore")
    if raw is None:
        raw = match.get("match_score")
    if raw is None:
        return None
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    if value > 1.0:
        value = value / 100.0
    return round(min(1.0, max(0.0, value)), 3)


def normalize_opportunity_match(match: dict) -> dict:
    """Coerce camelCase LLM/stored matches to snake_case fields."""
    normalized = dict(match)

    if not normalized.get("company"):
        normalized["company"] = normalized.get("organization") or "Unknown"

    score = normalize_alignment_score(normalized)
    if score is not None:
        normalized["alignment_score"] = score

    reasoning = normalized.get("alignment_reasoning") or normalized.get("alignmentReasoning")
    if reasoning:
        normalized["alignment_reasoning"] = reasoning
        normalized["alignmentReasoning"] = reasoning

    if normalized.get("missing_requirements") is None and normalized.get("missingRequirements") is not None:
        normalized["missing_requirements"] = normalized.get("missingRequirements")
    if normalized.get("proof_gaps") is None and normalized.get("proofGaps") is not None:
        normalized["proof_gaps"] = normalized.get("proofGaps")

    return normalized


def normalize_opportunity_alignment(matches: list | None) -> list:
    if not matches:
        return []
    return [normalize_opportunity_match(m) for m in matches if isinstance(m, dict)]
