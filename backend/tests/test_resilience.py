import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.core.dependencies import get_current_user
from app.models.user import User

from app.services.resilience.containment.subsystem_isolation import FailureContainmentEngine
from app.services.resilience.degradation.graceful_degradation import GracefulDegradationEngine
from app.services.resilience.recovery.recovery_coordinator import RecoveryCoordinator
from app.services.resilience.stabilization.orchestration_stabilizer import OrchestrationStabilizer
from app.services.resilience.resilience.resilience_scoring import RuntimeResilienceEngine

# 1. Mock user dependency override
async def mock_get_current_user():
    return User(id="user-123", email="test@example.com")

# 2. Test Failure Containment Engine
def test_failure_containment_engine():
    engine = FailureContainmentEngine()
    
    # Stable state input
    stable_data = {
        "exceptions_count": 0,
        "queue_depth": 5,
        "active_locks": [],
        "isolated_subsystems": []
    }
    result = engine.mitigate(stable_data)
    assert result["runtime_risk_score"] < 0.3
    assert result["recovery_priority"] == "LOW"
    assert "stable" in result["containment_reason"].lower()
    
    # Unstable state input (boundary breached)
    unstable_data = {
        "exceptions_count": 6,
        "queue_depth": 85,
        "active_locks": [{"holder": "SSEBroker", "blocked_by": "SSEBroker"}],
        "isolated_subsystems": []
    }
    result_unstable = engine.mitigate(unstable_data)
    assert result_unstable["runtime_risk_score"] > 0.3
    assert "Prediction Engine" in result_unstable["isolated_subsystems"]
    assert "Stream Transport Broker" in result_unstable["isolated_subsystems"]
    assert "Trajectory Propagation Queue" in result_unstable["propagation_lockdowns"]

# 3. Test Graceful Degradation Engine
def test_graceful_degradation_engine():
    engine = GracefulDegradationEngine()
    
    # Low stress input
    stable_stress = {
        "latency_ms": 50.0,
        "memory_usage_mb": 150.0,
        "memory_limit_mb": 512.0
    }
    result = engine.mitigate(stable_stress)
    assert result["active_profile"] == "OPTIMAL"
    assert result["expensive_telemetry_disabled"] is False
    assert result["system_stress_ratio"] < 0.4
    
    # High stress input (high memory, high latency)
    high_stress = {
        "latency_ms": 320.0,
        "memory_usage_mb": 450.0,
        "memory_limit_mb": 512.0
    }
    result_high = engine.mitigate(high_stress)
    assert result_high["active_profile"] in ["COMPRESSED", "MINIMAL"]
    assert result_high["expensive_telemetry_disabled"] is True
    assert result_high["system_stress_ratio"] >= 0.8

# 4. Test Recovery Coordinator
def test_recovery_coordinator():
    coordinator = RecoveryCoordinator()
    
    recovery_data = {
        "retry_count": 3,
        "sync_gap_count": 8,
        "snapshot": {"matchScore": 92.5},
        "divergent_keys": ["matchScore", "careerVelocity"]
    }
    result = coordinator.mitigate(recovery_data)
    assert result["total_actions"] >= 2
    
    components = [action["component_name"] for action in result["recovery_actions"]]
    assert "Transport Connection Layer" in components
    assert "Client Synchronization Tunnel" in components

# 5. Test Orchestration Stabilizer
def test_orchestration_stabilizer():
    stabilizer = OrchestrationStabilizer()
    
    # Low load input
    low_load = {
        "active_tasks": 5,
        "query_latencies": [10.0, 12.0],
        "request_rate": 2.0
    }
    result = stabilizer.mitigate(low_load)
    assert result["stabilization_applied"] is False
    assert result["throttle_pacing_delay"] == 0.0
    
    # High load input
    high_load = {
        "active_tasks": 80,
        "query_latencies": [250.0, 300.0],
        "request_rate": 45.0
    }
    result_high = stabilizer.mitigate(high_load)
    assert result_high["stabilization_applied"] is True
    assert result_high["throttle_pacing_delay"] > 0.0

# 6. Test Runtime Resilience Scoring Engine
def test_runtime_resilience_scoring():
    engine = RuntimeResilienceEngine()
    
    resilience_data = {
        "containment_quality": 0.95,
        "recovery_actions": [
            {"component_name": "Transport", "reconstruction_successful": True}
        ],
        "degradation_duration_seconds": 15.0,
        "exceptions": [],
        "orchestration_score": 0.96,
        "transport_score": 0.98
    }
    result = engine.mitigate(resilience_data)
    assert result["overall_survivability"] > 0.7
    assert result["containment_quality"] == 0.95

# 7. Test API Integration endpoints
@pytest.mark.asyncio
async def test_resilience_api_endpoints():
    app.dependency_overrides[get_current_user] = mock_get_current_user
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            
            # GET /v1/intelligence/resilience/status
            resp = await ac.get("/v1/intelligence/resilience/status")
            assert resp.status_code == 200
            data = resp.json()
            assert "containment_state" in data
            assert "degradation_state" in data
            assert "recovery_actions" in data
            assert "resilience_vector" in data
            assert "recovery_timeline" in data
            
            # POST /v1/intelligence/resilience/simulate-failure (stream_disconnect)
            resp = await ac.post(
                "/v1/intelligence/resilience/simulate-failure",
                json={"failure_type": "stream_disconnect"}
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "TRIGGERED"
            assert data["failure_type_simulated"] == "stream_disconnect"
            assert "Stream Transport Broker" in data["isolated_subsystems"]
            
            # GET /v1/intelligence/resilience/status (to verify failure simulation side-effects)
            resp = await ac.get("/v1/intelligence/resilience/status")
            assert resp.status_code == 200
            data = resp.json()
            assert data["containment_state"]["runtime_risk_score"] > 0.3
            assert len(data["containment_state"]["isolated_subsystems"]) > 0
            
            # POST /v1/intelligence/resilience/recover
            resp = await ac.post("/v1/intelligence/resilience/recover")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "RECOVERED"
            
            # GET /v1/intelligence/resilience/status (to verify recover side-effects)
            resp = await ac.get("/v1/intelligence/resilience/status")
            assert resp.status_code == 200
            data = resp.json()
            assert data["containment_state"]["runtime_risk_score"] < 0.3
            assert len(data["containment_state"]["isolated_subsystems"]) == 0
            
    finally:
        app.dependency_overrides.clear()
