import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.core.dependencies import get_current_user
from app.models.user import User

from app.services.observability.shared.trust_scoring import RuntimeTrustEngine
from app.services.observability.orchestration.orchestration_health import OrchestrationHealthEngine
from app.services.observability.prediction.prediction_drift import PredictionDriftMonitor
from app.services.observability.replay.replay_integrity import ReplayDeterminismAuditorEngine
from app.services.observability.transport.stream_health import TransportObservabilityLayer
from app.services.observability.runtime.runtime_health import RuntimeHealthEngine

# 1. Mock user dependency override
async def mock_get_current_user():
    return User(id="user-123", email="test@example.com")

# 2. Test dynamic trust calculation formulas
def test_runtime_trust_scoring():
    # Perfect score yields 1.0 trust vector
    trust = RuntimeTrustEngine.calculate_trust(1.0, 1.0, 1.0, 1.0, 1.0)
    assert trust.overall_runtime_trust == 1.0
    assert trust.orchestration_trust == 1.0

    # Low scores lower the overall trust coefficient
    partial_trust = RuntimeTrustEngine.calculate_trust(0.6, 0.7, 0.8, 0.5, 0.9)
    assert partial_trust.overall_runtime_trust < 1.0
    # Expected weighted sum: (0.6*0.25) + (0.7*0.20) + (0.8*0.20) + (0.5*0.15) + (0.9*0.20) = 0.15 + 0.14 + 0.16 + 0.075 + 0.18 = 0.705
    assert partial_trust.overall_runtime_trust == 0.705

# 3. Test Orchestration Health engine
def test_orchestration_health_engine():
    engine = OrchestrationHealthEngine()
    data = {
        "latency_ms": 135.0,
        "propagation_events": [{"status": "SUCCESS"}, {"status": "FAILED"}],
        "nodes": [{"id": "n1"}, {"id": "n2"}],
        "dependencies": [{"parent_id": "n1", "child_id": "n2"}],
        "degraded_cycles": 1,
        "replay_alignment": 0.92
    }
    result = engine.diagnose(data)
    assert result["runtime_stability_score"] > 0.0
    assert result["propagation_integrity_score"] == 0.5
    assert result["degraded_cycle_count"] == 1

# 4. Test Prediction Drift monitor
def test_prediction_drift_monitor():
    engine = PredictionDriftMonitor()
    data = {
        "confidence_history": [0.95, 0.90, 0.85],
        "predicted_metrics": {"matchScore": 94.0},
        "actual_metrics": {"matchScore": 88.0},
        "simulation_runs": []
    }
    result = engine.diagnose(data)
    assert result["drift_coefficient"] > 0.0
    assert result["confidence_decay_rate"] == 0.1
    assert "calibration stability" in result["drift_diagnostics"].lower()

# 5. Test Replay Auditor engine
def test_replay_auditor_engine():
    engine = ReplayDeterminismAuditorEngine()
    data = {
        "reference_run": {"transitions": ["A", "B"], "state": {"x": 1}},
        "replay_run": {"transitions": ["A", "B"], "state": {"x": 1}},
        "snapshot": {"val": 100},
        "expected_checksum": ""
    }
    result = engine.diagnose(data)
    assert result["determinism_index"] == 1.0
    assert result["snapshot_integrity_score"] == 1.0
    assert result["reproducibility_intact"] is True

# 6. Test Transport Uptime monitor
def test_transport_uptime_layer():
    engine = TransportObservabilityLayer()
    data = {
        "disconnect_timestamps": [1000.0, 1010.0, 1020.0],
        "sync_delays_ms": [10.0, 20.0],
        "payload_events": [{"corrupted": True}, {"corrupted": False}],
        "uptime_ratio": 0.95,
        "heartbeat_quality": 0.90
    }
    result = engine.diagnose(data)
    assert result["uptime_ratio"] == 0.95
    assert result["payload_corruption_rate"] == 0.5
    assert result["synchronization_delay_ms"] == 15.0

# 7. Test System Runtime engine
def test_runtime_health_engine():
    engine = RuntimeHealthEngine()
    data = {
        "memory_usage_mb": 200.0,
        "memory_limit_mb": 512.0,
        "scheduled_tasks": 150,
        "cancelled_tasks": 3,
        "query_latencies": [10.0, 20.0],
        "system_load_percent": 15.0
    }
    result = engine.diagnose(data)
    assert result["memory_consumption_mb"] == 200.0
    assert result["async_task_cancellations"] == 3
    assert result["system_load_percent"] == 15.0

# 8. Test API Integration endpoints
@pytest.mark.asyncio
async def test_observability_api_endpoints():
    app.dependency_overrides[get_current_user] = mock_get_current_user
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            
            # GET /v1/intelligence/observability/status
            resp = await ac.get("/v1/intelligence/observability/status")
            assert resp.status_code == 200
            data = resp.json()
            assert "orchestration_health" in data
            assert "trust_vector" in data
            
            # GET /v1/intelligence/observability/history
            resp = await ac.get("/v1/intelligence/observability/history")
            assert resp.status_code == 200
            data = resp.json()
            assert "history" in data
            assert len(data["history"]) == 6

            # POST /v1/intelligence/observability/audit
            resp = await ac.post("/v1/intelligence/observability/audit")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "COMPLETED"
            assert data["integrity_checksum_match"] is True
    finally:
        app.dependency_overrides.clear()
