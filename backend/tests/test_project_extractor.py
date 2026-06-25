"""Tests for resume project extraction heuristics."""

from app.services.resume_pipeline.intelligence.project_extractor import derive_projects_from_entities


def test_derive_projects_from_explicit_list():
    entities = {
        "projects": [{"name": "Shop API", "description": "E-commerce backend", "technology_stack": ["Python"]}],
    }
    result = derive_projects_from_entities(entities)
    assert len(result) == 1
    assert result[0]["name"] == "Shop API"


def test_derive_projects_from_experience_when_projects_empty():
    entities = {
        "projects": [],
        "experience": [
            {
                "title": "Payments Platform",
                "company": "Acme",
                "description": "Built microservices handling 10k req/s",
                "skills_used": ["Go", "Kafka"],
            },
            {
                "title": "Intern",
                "company": "Other",
                "description": "Assisted team with documentation",
                "skills_used": [],
            },
        ],
    }
    result = derive_projects_from_entities(entities)
    assert len(result) == 1
    assert "Payments Platform" in result[0]["name"]
    assert result[0]["technology_stack"] == ["Go", "Kafka"]
