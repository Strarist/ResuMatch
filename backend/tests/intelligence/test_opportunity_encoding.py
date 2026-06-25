"""Tests for opportunity text encoding repair and garbled text detection."""

from app.services.opportunity_engine.quality.text_encoding import (
    extract_skills_from_description,
    is_garbled_text,
    repair_mojibake,
    sanitize_job_text_fields,
)
from app.services.opportunity_engine.quality import sanitize_and_rank_opportunities


def test_repair_mojibake_spanish_location():
    assert repair_mojibake("EspaÃ±a") == "España"


def test_repair_mojibake_unchanged_ascii():
    title = "Senior Backend Engineer"
    assert repair_mojibake(title) == title


def test_is_garbled_text_rejects_heavy_mojibake():
    garbled = "æ­°åªä½è¿èè¥ï¼ç°¿ä¸"
    assert is_garbled_text(garbled) is True


def test_is_garbled_text_accepts_normal_unicode():
    assert is_garbled_text("Senior 后端工程师") is False
    assert is_garbled_text("Backend Engineer — Remote") is False


def test_sanitize_job_text_fields_repairs_location():
    job = {"title": "Engineer", "company": "Acme", "location": "EspaÃ±a", "description": ""}
    cleaned = sanitize_job_text_fields(job)
    assert cleaned["location"] == "España"


def test_quality_pipeline_filters_garbled_title():
    jobs = [
        {
            "title": "æ­°åªä½è¿èè¥ï¼ç°¿ä¸",
            "company": "Unknown",
            "location": "Remote",
            "compensation": "$120k",
            "posted_at": "2026-06-20T00:00:00+00:00",
            "tags": ["python"],
        },
        {
            "title": "Backend Engineer",
            "company": "Acme",
            "location": "Remote",
            "compensation": "$140k",
            "posted_at": "2026-06-21T00:00:00+00:00",
            "tags": ["python", "fastapi"],
        },
    ]
    result = sanitize_and_rank_opportunities(jobs)
    assert len(result) == 1
    assert result[0]["title"] == "Backend Engineer"


def test_extract_skills_from_description():
    description = "We use Python, FastAPI, PostgreSQL, and Docker in production."
    skills = extract_skills_from_description(description)
    assert "python" in skills
    assert "fastapi" in skills
    assert "docker" in skills
