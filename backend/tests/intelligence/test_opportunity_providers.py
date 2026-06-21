"""Unit tests for modular opportunity providers."""

import pytest
from app.services.opportunity_engine.providers.base import BaseOpportunityProvider
from app.services.opportunity_engine.providers.remoteok import RemoteOKProvider
from app.services.opportunity_engine.providers.arbeitnow import ArbeitnowProvider
from app.services.opportunity_engine.providers import get_providers

def test_providers_registry():
    """Verify that all modular providers are correctly registered."""
    providers = get_providers()
    assert len(providers) >= 2
    assert any(isinstance(p, RemoteOKProvider) for p in providers)
    assert any(isinstance(p, ArbeitnowProvider) for p in providers)

def test_remoteok_normalization():
    """Verify RemoteOK raw job normalization matches standard schema."""
    provider = RemoteOKProvider()
    raw_job = {
        "position": "Staff Core Systems Engineer",
        "company": "Fastly",
        "url": "https://fastly.com/jobs/123",
        "location": "Global / Remote",
        "description": "Maintain robust edge caches.",
        "tags": ["Go", "Kubernetes", "Redis"],
        "salary": "$175,000"
    }
    normalized = provider.normalize(raw_job)
    assert normalized["title"] == "Staff Core Systems Engineer"
    assert normalized["company"] == "Fastly"
    assert normalized["location"] == "Global / Remote"
    assert normalized["remote"] is True
    assert "go" in normalized["tags"]
    assert normalized["source"] == "RemoteOK"
    assert normalized["posted_at"] is not None

def test_arbeitnow_normalization():
    """Verify Arbeitnow raw job normalization matches standard schema."""
    provider = ArbeitnowProvider()
    raw_job = {
        "title": "React Frontend Architect",
        "company_name": "Delivery Hero",
        "url": "https://arbeitnow.com/hero",
        "location": "Berlin, Germany",
        "remote": True,
        "description": "Design high performance micro-frontends.",
        "tags": ["react", "typescript"],
        "created_at": 1716982400
    }
    normalized = provider.normalize(raw_job)
    assert normalized["title"] == "React Frontend Architect"
    assert normalized["company"] == "Delivery Hero"
    assert normalized["remote"] is True
    assert "react" in normalized["tags"]
    assert normalized["source"] == "Arbeitnow"
    assert normalized["posted_at"] is not None
