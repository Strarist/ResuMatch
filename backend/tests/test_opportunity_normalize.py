"""Tests for opportunity match field normalization."""

from app.services.opportunities.normalize import (
    normalize_alignment_score,
    normalize_opportunity_match,
    normalize_opportunity_alignment,
)


def test_normalize_alignment_score_from_camel_case_fraction():
    assert normalize_alignment_score({"alignmentScore": 0.85}) == 0.85


def test_normalize_alignment_score_from_percent():
    assert normalize_alignment_score({"match_score": 88}) == 0.88


def test_normalize_opportunity_match_snake_case_fields():
    raw = {
        "title": "Senior Dev",
        "company": "Acme",
        "alignmentScore": 0.72,
        "alignmentReasoning": "Strong stack overlap",
        "missingRequirements": ["K8s"],
        "proofGaps": ["portfolio"],
    }
    out = normalize_opportunity_match(raw)
    assert out["alignment_score"] == 0.72
    assert out["alignment_reasoning"] == "Strong stack overlap"
    assert out["missing_requirements"] == ["K8s"]
    assert out["proof_gaps"] == ["portfolio"]


def test_normalize_opportunity_alignment_list():
    matches = [{"alignmentScore": 0.5, "organization": "Co"}]
    out = normalize_opportunity_alignment(matches)
    assert len(out) == 1
    assert out[0]["company"] == "Co"
    assert out[0]["alignment_score"] == 0.5
