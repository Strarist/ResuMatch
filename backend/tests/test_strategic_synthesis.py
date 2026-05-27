import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.core.dependencies import get_current_user
from app.models.user import User

from app.services.synthesis.compression.signal_compressor import SignalCompressor
from app.services.synthesis.opportunity.opportunity_synthesis import OpportunitySynthesisEngine
from app.services.synthesis.risk.strategic_risk_summary import StrategicRiskSynthesizer
from app.services.synthesis.digest.digest_generator import StrategicDigestGenerator
from app.services.synthesis.narrative.narrative_engine import NarrativeEngine

# 1. Mock user dependency override
async def mock_get_current_user():
    return User(id="user-123", email="test@example.com")

# 2. Sample data payload
@pytest.fixture
def sample_synthesis_data():
    return {
        "metrics": {
            "matchScore": 95.0,
            "careerVelocity": 82.0,
            "marketFit": 93.0,
            "recruiterConfidence": 88.0
        },
        "previous_metrics": {
            "matchScore": 90.0,
            "careerVelocity": 80.0,
            "marketFit": 90.0,
            "recruiterConfidence": 85.0
        },
        "metric_history": [
            {"matchScore": 88.0, "careerVelocity": 78.0},
            {"matchScore": 92.0, "careerVelocity": 80.0},
            {"matchScore": 95.0, "careerVelocity": 82.0}
        ],
        "improved_skills": ["FastAPI", "Systems", "TypeScript", "Kubernetes"],
        "influence_chain": {
            "weighting_breakdown": {
                "systems_importance": 0.85,
                "fastapi_importance": 0.78
            }
        },
        "optimization_trace": [
            {"node_title": "Implement Distributed SSE", "position_shift": "UP"},
            {"node_title": "Refactor Memory Caching", "position_shift": "NEW"}
        ],
        "confidence_vector": {
            "trajectory": 0.88,
            "causal": 0.92,
            "optimization": 0.85
        },
        "recruiter_prob": {
            "success_probability": 0.65
        },
        "execution_consistency": 0.95,
        "consecutive_stagnant_days": 1,
        "closing_days": 10,
        "unresponsive_leads": 1,
        "weeks_inactive": 1
    }

# 3. Unit Tests for Synthesis Engines

def test_signal_compressor(sample_synthesis_data):
    engine = SignalCompressor()
    result = engine.synthesize(sample_synthesis_data)
    assert "signals" in result
    assert len(result["signals"]) >= 2
    
    # Check CompressedSignal schema integrity
    for signal in result["signals"]:
        assert "signal_type" in signal
        assert "strategic_importance" in signal
        assert "urgency" in signal
        assert "leverage_impact" in signal
        assert "confidence" in signal
        assert "synthesis_summary" in signal

def test_opportunity_synthesis(sample_synthesis_data):
    engine = OpportunitySynthesisEngine()
    result = engine.synthesize(sample_synthesis_data)
    assert "opportunity_clusters" in result
    assert len(result["opportunity_clusters"]) == 2
    
    cluster = result["opportunity_clusters"][0]
    assert cluster["cluster_name"] == "Cloud-Native Realtime API Architecture"
    assert cluster["compound_leverage_multiplier"] > 1.0
    assert cluster["recruiter_pull_index"] > 0
    assert cluster["market_demand_index"] > 0

def test_risk_synthesis(sample_synthesis_data):
    engine = StrategicRiskSynthesizer()
    result = engine.synthesize(sample_synthesis_data)
    assert "stagnation_coefficient" in result
    assert "risk_factor_level" in result
    assert "diagnostics_brief" in result
    assert "active_risk_triggers" in result
    assert "reconstruction_actions" in result
    assert result["stagnation_coefficient"] < 0.5  # because consistency is high

def test_digest_synthesis(sample_synthesis_data):
    engine = StrategicDigestGenerator()
    result = engine.synthesize(sample_synthesis_data)
    assert "trajectory_summary" in result
    assert "execution_delta" == 5.55 or result["execution_delta"] > 0
    assert "strategic_focus_recommendation" in result

def test_narrative_synthesis(sample_synthesis_data):
    engine = NarrativeEngine()
    result = engine.synthesize(sample_synthesis_data)
    assert "narrative_brief" in result
    assert "execution_storyline" in result
    assert len(result["execution_storyline"]) == 4

# 4. Integration REST API Tests

@pytest.mark.asyncio
async def test_synthesis_api_endpoints():
    app.dependency_overrides[get_current_user] = mock_get_current_user
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:

            
            # GET /v1/intelligence/synthesis/narrative
            resp = await ac.get("/v1/intelligence/synthesis/narrative")
            assert resp.status_code == 200
            data = resp.json()
            assert "narrative_brief" in data
            assert "execution_storyline" in data
            
            # GET /v1/intelligence/synthesis/digest
            resp = await ac.get("/v1/intelligence/synthesis/digest")
            assert resp.status_code == 200
            data = resp.json()
            assert "trajectory_summary" in data
            assert "compressed_signals" in data

            # GET /v1/intelligence/synthesis/opportunity
            resp = await ac.get("/v1/intelligence/synthesis/opportunity")
            assert resp.status_code == 200
            data = resp.json()
            assert "opportunity_clusters" in data

            # GET /v1/intelligence/synthesis/risk
            resp = await ac.get("/v1/intelligence/synthesis/risk")
            assert resp.status_code == 200
            data = resp.json()
            assert "stagnation_coefficient" in data
    finally:
        app.dependency_overrides.clear()
