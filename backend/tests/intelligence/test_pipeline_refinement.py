"""Unit tests for Phase 14.0 Pipeline Refinement, Opportunity Quality and Parser Hardening V2."""

import pytest
from app.services.opportunity_engine.quality.stale_filter import is_job_stale
from app.services.opportunity_engine.quality.duplicate_detector import filter_duplicates
from app.services.opportunity_engine.quality.title_normalizer import clean_and_normalize_title
from app.services.opportunity_engine.quality.compensation_parser import parse_compensation, compensation_midpoint
from app.services.resume_pipeline.intelligence.achievement_extractor import extract_achievements
from app.services.resume_pipeline.intelligence.certification_parser import parse_and_normalize_certifications
from app.services.resume_pipeline.intelligence.experience_ranker import rank_experience_seniority, parse_duration_to_years

def test_stale_filter_detection():
    # Job with explicit filled/expired tags
    job_stale = {"title": "Backend Ninja (Expired)", "description": "This job is closed.", "source": "Web"}
    job_fresh = {"title": "Staff Backend Engineer", "description": "Build NextJS API interfaces", "source": "Seed"}

    assert is_job_stale(job_stale) is True
    assert is_job_stale(job_fresh) is False

def test_title_normalizer_rejections():
    # Gimmick rejection
    title1, is_valid1 = clean_and_normalize_title("Fullstack Engineering Ninja")
    assert is_valid1 is False

    # Normalization variations
    title2, is_valid2 = clean_and_normalize_title("Staff Cloud Infra Eng II")
    assert is_valid2 is True
    assert "Infrastructure Engineer" in title2

def test_compensation_parsing():
    res1 = parse_compensation("$140k - 180k USD")
    assert res1["min_amount"] == 140000.0
    assert res1["max_amount"] == 180000.0
    assert "$140,000 - $180,000" in res1["formatted"]


def test_compensation_midpoint_handles_partial_values():
    assert compensation_midpoint({"min_amount": 140000.0, "max_amount": 180000.0}) == 160000.0
    assert compensation_midpoint({"min_amount": 140000.0, "max_amount": None}) == 140000.0
    assert compensation_midpoint({"min_amount": None, "max_amount": 180000.0}) == 180000.0
    assert compensation_midpoint({"min_amount": None, "max_amount": None}) == 150000.0


def test_stale_filter_unparseable_date_does_not_raise():
    job = {
        "title": "Backend Engineer",
        "description": "Build APIs",
        "created_at": "not-a-valid-date",
    }
    assert is_job_stale(job) is False


def test_stale_filter_uses_posted_at():
    from datetime import datetime, timezone, timedelta

    old_date = (datetime.now(timezone.utc) - timedelta(days=45)).strftime("%Y-%m-%dT%H:%M:%S")
    fresh_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")

    assert is_job_stale({"title": "Old Role", "description": "Build APIs", "posted_at": old_date}) is True
    assert is_job_stale({"title": "Fresh Role", "description": "Build APIs", "posted_at": fresh_date}) is False


def test_relevance_ranker_uses_posted_at():
    from app.services.opportunity_engine.quality.relevance_ranker import evaluate_listing_credibility

    result = evaluate_listing_credibility({
        "source": "RemoteOK",
        "posted_at": "2026-06-01T00:00:00Z",
    })
    assert result["freshness"] == "2026-06-01T00:00:00Z"

def test_duplicate_jaccard_deduplication():
    jobs = [
        {"title": "DevOps Architect", "company": "Vercel", "description": "Configure Terraform and K8S clusters", "url": "vercel.com/j1"},
        {"title": "DevOps Architect", "company": "Vercel", "description": "Configure Terraform and K8S clusters", "url": "vercel.com/j1?ref=test"}
    ]
    deduped = filter_duplicates(jobs)
    assert len(deduped) == 1

def test_achievements_and_certs_heuristics():
    resume_text = (
        "Professional Experience:\n"
        "- Scaled API ingestion pipeline by 45% using Redis clusters\n"
        "- Managed team of 5 backend platform builders\n"
        "- Certifications:\n"
        "- AWS Solutions Architect Associate\n"
        "- Certified Kubernetes Administrator (CKA)"
    )

    achievements = extract_achievements(resume_text)
    assert len(achievements) >= 1
    assert any("45%" in a for a in achievements)

    certs = parse_and_normalize_certifications(resume_text)
    assert "AWS Certified Solutions Architect" in certs
    assert "Certified Kubernetes Administrator (CKA)" in certs

def test_cors_origins_parses_comma_separated_env_value():
    from app.config import Settings

    settings = Settings(
        DATABASE_URL="sqlite+aiosqlite:///./dev.db",
        JWT_SECRET="test-secret-minimum-16-chars",
        OPENROUTER_API_KEY="sk-or-v1-test-integration-key-valid",
        CORS_ORIGINS="http://localhost:3000,http://localhost:8000",
    )
    assert settings.cors_origins == ["http://localhost:3000", "http://localhost:8000"]


def test_experience_ranker_seniority():
    experiences = [
        {"title": "SRE Lead", "duration": "4 years"},
        {"title": "Infrastructure Eng", "duration": "2019 - 2021"}
    ]
    rank_res = rank_experience_seniority(experiences)
    assert rank_res["aggregated_years_experience"] == 6.0
    assert rank_res["inferred_seniority_rank"] == "Senior Engineer"
