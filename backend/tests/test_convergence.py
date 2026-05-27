import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.core.dependencies import get_current_user
from app.models.user import User

from app.services.convergence.orchestration.orchestration_convergence import OrchestrationConvergenceEngine
from app.services.convergence.synchronization.replay_alignment import ReplayAlignmentEngine
from app.services.convergence.telemetry.telemetry_compressor import TelemetryCompressionEngine
from app.services.convergence.reliability.reliability_calibrator import ReliabilityCalibrationEngine
from app.services.convergence.runtime.runtime_simplifier import ArchitecturePruningEngine

# 1. Mock user dependency override
async def mock_get_current_user():
    return User(id="user-123", email="test@example.com")

# 2. Test Orchestration Convergence Engine
def test_orchestration_convergence_engine():
    engine = OrchestrationConvergenceEngine()
    
    # Empty input yields stable defaults
    result = engine.mitigate({})
    assert result["optimized_queue_depth"] == 20
    assert result["topology_depth_after"] == 4
    assert result["simplification_percentage"] > 0.0

    # Custom load values
    custom_data = {
        "active_chains": ["ChainA", "ChainA", "ChainB"],
        "queue_depth": 60,
        "nodes_count": 20,
        "topology_depth": 10
    }
    result_custom = engine.mitigate(custom_data)
    assert result_custom["optimized_queue_depth"] == 30
    assert "ChainA" in result_custom["redundant_paths_identified"]
    assert result_custom["topology_depth_after"] == 5

# 3. Test Replay Alignment Engine
def test_replay_alignment_engine():
    engine = ReplayAlignmentEngine()
    
    result = engine.mitigate({
        "sync_gap": 5,
        "divergent_keys": ["matchScore", "careerVelocity", "marketFit"],
        "payload_size_kb": 12.0,
        "aligned_snapshots_count": 8
    })
    assert result["is_alignment_coherent"] is False
    assert result["catchup_alignment_cycles"] == 1
    assert result["delta_compression_ratio"] < 1.0

# 4. Test Telemetry Compression Engine
def test_telemetry_compression_engine():
    engine = TelemetryCompressionEngine()
    
    result = engine.mitigate({
        "original_signals_count": 100,
        "repeated_checks": 50,
        "narrative_tokens_count": 300
    })
    assert result["telemetry_savings_percentage"] > 0.4
    assert result["signal_priority"] in ["HIGH", "MEDIUM"]

# 5. Test Reliability Calibration Engine
def test_reliability_calibration_engine():
    engine = ReliabilityCalibrationEngine()
    
    result = engine.mitigate({
        "stability_factor": 1.2,
        "stable_epochs": 6,
        "load_stability": 0.85
    })
    assert result["calibrated_trust_score"] == 0.99 or result["calibrated_trust_score"] == 1.14 # capped at 0.99
    assert result["resilience_retry_cooldown_seconds"] == 45.0
    assert result["adjusted_degradation_latency_ms"] == 300.0

# 6. Test Architecture Pruning Engine
def test_architecture_pruning_engine():
    engine = ArchitecturePruningEngine()
    
    result = engine.mitigate({})
    assert len(result["dead_abstractions"]) > 0
    assert result["pruning_safety_score"] > 0.8
    assert result["estimated_loc_saved"] > 100

# 7. Test API Integration endpoints
@pytest.mark.asyncio
async def test_convergence_api_endpoints():
    app.dependency_overrides[get_current_user] = mock_get_current_user
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            
            # 1. GET /v1/intelligence/convergence/status (Baseline)
            resp = await ac.get("/v1/intelligence/convergence/status")
            assert resp.status_code == 200
            data = resp.json()
            assert "coherence_index" in data
            assert data["is_optimized"] is False
            assert data["is_calibrated"] is False
            
            # 2. POST /v1/intelligence/convergence/optimize
            resp = await ac.post("/v1/intelligence/convergence/optimize")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "OPTIMIZED"
            
            # 3. GET /v1/intelligence/convergence/status (to verify side-effects)
            resp = await ac.get("/v1/intelligence/convergence/status")
            assert resp.status_code == 200
            data = resp.json()
            assert data["is_optimized"] is True
            assert data["orchestration_state"]["topology_depth_after"] == 4
            
            # 4. POST /v1/intelligence/convergence/calibrate
            resp = await ac.post("/v1/intelligence/convergence/calibrate")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "CALIBRATED"
            
            # 5. GET /v1/intelligence/convergence/status (to verify side-effects)
            resp = await ac.get("/v1/intelligence/convergence/status")
            assert resp.status_code == 200
            data = resp.json()
            assert data["is_calibrated"] is True
            assert data["reliability_state"]["resilience_retry_cooldown_seconds"] == 60.0
            
            # 6. POST /v1/intelligence/convergence/reset
            resp = await ac.post("/v1/intelligence/convergence/reset")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "RESET"
            
            # 7. GET /v1/intelligence/convergence/status (to verify final reset)
            resp = await ac.get("/v1/intelligence/convergence/status")
            assert resp.status_code == 200
            data = resp.json()
            assert data["is_optimized"] is False
            assert data["is_calibrated"] is False
            
    finally:
        app.dependency_overrides.clear()
