"""Unit tests for upgraded 6-factor opportunity matching and market intelligence scoring."""

import pytest
from unittest.mock import AsyncMock, patch

from app.models.strategic_profile import StrategicProfile
from app.services.opportunity_engine.ingestion import match_jobs_for_candidate
from app.services.market_intelligence.recruiter_demand import compute_recruiter_demand_index
from app.services.market_intelligence.engine import compute_market_intelligence

def test_recruiter_demand_index():
    """Verify recruiter demand calculations based on crawls."""
    jobs = [
        {"title": "Backend", "tags": ["go", "redis", "kubernetes"]},
        {"title": "DevOps", "tags": ["kubernetes", "terraform"]},
        {"title": "Frontend", "tags": ["react", "typescript"]}
    ]
    user_skills = ["Go", "React"]

    demand = compute_recruiter_demand_index(jobs, user_skills)
    assert "kubernetes" in demand
    assert "redis" in demand
    # Kubernetes has highest frequency, so demand score should be high
    assert demand["kubernetes"]["demand_score"] > 0.5
    assert demand["kubernetes"]["scarcity_score"] is not None

@pytest.mark.asyncio
async def test_six_factor_matching_and_relevance():
    """Verify 6-factor opportunity match calculator runs successfully."""
    profile = StrategicProfile(
        user_id="test-candidate",
        inferred_skills=["Go", "Kubernetes", "Redis", "Docker"],
        active_specialization="Platform Infrastructure Lead",
        target_role="Lead Platform Architect",
        trajectory_state={
            "competitiveness_score": 0.85 # Estimates 8.5 years of experience
        }
    )

    matches = await match_jobs_for_candidate(profile)
    assert len(matches) > 0

    # Check that new 6-factor ranking variables are in each match item
    for match in matches:
        assert "match_score" in match
        assert match["match_score"] >= 0 and match["match_score"] <= 100
        assert "alignmentReasoning" in match
        assert "compensation" in match
        assert "matching_signals" in match

@pytest.mark.asyncio
@patch("app.services.opportunity_engine.ingestion.get_crawled_jobs", new_callable=AsyncMock)
async def test_proof_gaps_case_insensitive_for_capitalized_skills(mock_jobs):
    mock_jobs.return_value = [{
        "title": "Platform Engineer",
        "company": "Acme",
        "tags": ["Kubernetes", "Redis", "Go"],
        "compensation": "$180,000 - $240,000",
        "url": "https://example.com/job/1",
        "source": "Test",
        "posted_at": "2026-06-01T00:00:00Z",
    }]
    profile = StrategicProfile(
        user_id="test-candidate",
        inferred_skills=["Go"],
        active_specialization="Platform Engineering",
        target_role="Platform Engineer",
        trajectory_state={"competitiveness_score": 0.8},
    )

    matches = await match_jobs_for_candidate(profile)
    assert matches
    proof_gaps = matches[0]["proof_gaps"]
    assert "Ingress traffic controllers proof" in proof_gaps
    assert "Distributed caching benchmark proof" in proof_gaps


@pytest.mark.asyncio
@patch("app.services.opportunity_engine.ingestion.get_crawled_jobs", new_callable=AsyncMock)
async def test_missing_skill_penalty_normalizes_whitespace(mock_jobs):
    mock_jobs.return_value = [{
        "title": "Platform Engineer",
        "company": "Acme",
        "tags": [" Redis ", "Go"],
        "compensation": "$180,000 - $240,000",
        "url": "https://example.com/job/3",
        "source": "Test",
        "posted_at": "2026-06-01T00:00:00Z",
    }]
    profile = StrategicProfile(
        user_id="test-whitespace",
        inferred_skills=["Go"],
        active_specialization="Platform Engineering",
        target_role="Platform Engineer",
        trajectory_state={"competitiveness_score": 0.8},
    )

    matches = await match_jobs_for_candidate(profile)
    assert matches
    match = matches[0]
    assert "Distributed caching benchmark proof" in match["proof_gaps"]
    assert any("Missing high-impact requirement" in reason for reason in match["match_reason"])

@pytest.mark.asyncio
@patch("app.services.opportunity_engine.ingestion.get_crawled_jobs", new_callable=AsyncMock)
async def test_match_jobs_handles_null_competitiveness_score(mock_jobs):
    mock_jobs.return_value = [{
        "title": "Software Engineer",
        "company": "Acme",
        "tags": ["Python"],
        "compensation": "$150,000",
        "url": "https://example.com/job/2",
        "source": "Test",
    }]
    profile = StrategicProfile(
        user_id="test-null-score",
        inferred_skills=["Python"],
        target_role="Software Engineer",
        trajectory_state={"competitiveness_score": None},
    )

    matches = await match_jobs_for_candidate(profile)
    assert matches

def test_dynamic_market_intelligence_computations():
    """Verify dynamic market snap computations execute correctly."""
    user_skills = ["Go", "Kubernetes", "Redis"]
    confidences = {"Go": 0.90, "Kubernetes": 0.80, "Redis": 0.70}

    snap = compute_market_intelligence(
        user_skills=user_skills,
        skill_confidences=confidences,
        target_role="Staff Site Reliability Engineer",
        seniority="senior",
        growth_velocity=0.92
    )

    assert "skill_demand" in snap
    assert "roi_skills" in snap
    assert "recruiter_attractiveness" in snap
    assert "salary_trajectory" in snap
    assert "high_value_missing" in snap
    assert "demand_graph" in snap

    # Verify dynamic salary Trajectory Low/High ceilings exist
    low_band = snap["salary_trajectory"]["estimated_range"]["low"]
    high_band = snap["salary_trajectory"]["estimated_range"]["high"]
    assert low_band > 0
    assert high_band > low_band
