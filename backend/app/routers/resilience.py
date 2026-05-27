from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List
import time

from app.core.dependencies import get_db, get_current_user
from app.models.user import User

from app.services.resilience.containment.subsystem_isolation import FailureContainmentEngine
from app.services.resilience.degradation.graceful_degradation import GracefulDegradationEngine
from app.services.resilience.recovery.recovery_coordinator import RecoveryCoordinator
from app.services.resilience.stabilization.orchestration_stabilizer import OrchestrationStabilizer
from app.services.resilience.resilience.resilience_scoring import RuntimeResilienceEngine

router = APIRouter(prefix="/v1/intelligence/resilience", tags=["Runtime Resilience"])

class SimulatedResilienceState:
    """Singleton/Static state broker simulating runtime faults and recovery paces."""
    
    exceptions_count = 0
    degradation_duration = 0.0
    retry_count = 0
    sync_gap = 1
    isolated_subsystems: List[str] = []
    divergent_keys: List[str] = []
    recovery_logs: List[Dict[str, Any]] = []

@router.get("/status")
async def get_resilience_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetches full runtime containment states, graceful degradation, and survivability vectors."""
    state = SimulatedResilienceState

    # 1. Prepare raw inputs for mitigate sub-engines
    active_locks = []
    if "Stream Transport Broker" in state.isolated_subsystems:
        active_locks.append({"holder": "SSEBroker", "blocked_by": "SSEBroker"})  # Circular lock simulation

    containment_input = {
        "exceptions_count": state.exceptions_count,
        "queue_depth": 85 if state.exceptions_count > 0 else 10,
        "active_locks": active_locks,
        "isolated_subsystems": state.isolated_subsystems
    }

    degradation_input = {
        "latency_ms": 280.0 if state.exceptions_count > 0 else 115.0,
        "memory_usage_mb": 420.0 if state.degradation_duration > 0 else 180.0,
        "memory_limit_mb": 512.0
    }

    recovery_input = {
        "retry_count": state.retry_count,
        "sync_gap_count": state.sync_gap,
        "snapshot": {"matchScore": 94.0},
        "divergent_keys": state.divergent_keys
    }

    # 2. Run Mitigate sub-engines
    containment_engine = FailureContainmentEngine()
    degradation_engine = GracefulDegradationEngine()
    recovery_engine = RecoveryCoordinator()
    stabilizer_engine = OrchestrationStabilizer()
    resilience_scoring = RuntimeResilienceEngine()

    containment_state = containment_engine.mitigate(containment_input)
    degradation_state = degradation_engine.mitigate(degradation_input)
    recovery_info = recovery_engine.mitigate(recovery_input)
    stabilizer_info = stabilizer_engine.mitigate({
        "active_tasks": 90 if state.exceptions_count > 0 else 20,
        "query_latencies": [180.0, 220.0] if state.exceptions_count > 0 else [14.0, 16.0],
        "request_rate": 45.0 if state.exceptions_count > 0 else 5.0
    })

    # 3. Calculate Overall Resilience vector
    resilience_input = {
        "containment_quality": containment_state["runtime_risk_score"] if state.exceptions_count == 0 else 0.55,
        "recovery_actions": recovery_info["recovery_actions"],
        "degradation_duration_seconds": state.degradation_duration,
        "exceptions": [{"component": "Prediction Engine"} for _ in range(state.exceptions_count)],
        "orchestration_score": 0.95 if not stabilizer_info["stabilization_applied"] else 0.65,
        "transport_score": 0.98 if state.retry_count == 0 else 0.58
    }
    # Dynamic invert logic: low risk yields high containment quality
    if state.exceptions_count == 0:
        resilience_input["containment_quality"] = 1.0 - containment_state["runtime_risk_score"]

    resilience_vector = resilience_scoring.mitigate(resilience_input)

    # 4. Generate recovery timelines explorer logs
    timeline = []
    base_time = int(time.time())
    
    if state.exceptions_count > 0:
        timeline.append({
            "timestamp": base_time - 30,
            "event": "Subsystem Exception Raised",
            "component": "Boundary Monitor",
            "status": "DANGER",
            "message": f"{state.exceptions_count} active exceptions breached target boundary limit."
        })
        timeline.append({
            "timestamp": base_time - 25,
            "event": "Failure Isolated",
            "component": "Containment Engine",
            "status": "WARNING",
            "message": f"Subsystems locked down: {', '.join(containment_state['isolated_subsystems'])}."
        })
        timeline.append({
            "timestamp": base_time - 20,
            "event": "Graceful Degradation Profile Activated",
            "component": "Degradation Layer",
            "status": "WARNING",
            "message": f"Active profile set to {degradation_state['active_profile']} due to system latency saturation."
        })
    else:
        # Default stable recovery logs
        timeline.append({
            "timestamp": base_time - 300,
            "event": "Replay Restored",
            "component": "Replay Coordinator",
            "status": "SUCCESS",
            "message": "State check sum integrity matched last verified checkpoint."
        })
        timeline.append({
            "timestamp": base_time - 240,
            "event": "Sync pathway Re-established",
            "component": "Synchronization Tunnel",
            "status": "SUCCESS",
            "message": "Dynamic tunnel catching up lag frames."
        })
        timeline.append({
            "timestamp": base_time - 180,
            "event": "Workload Workstation Rebalanced",
            "component": "Stabilizer Engine",
            "status": "SUCCESS",
            "message": "Concurrency workload rebalanced with optimal capacity."
        })

    return {
        "containment_state": containment_state,
        "degradation_state": degradation_state,
        "recovery_actions": recovery_info["recovery_actions"],
        "stabilizer_recommendations": stabilizer_info,
        "resilience_vector": resilience_vector,
        "recovery_timeline": timeline
    }

@router.post("/simulate-failure")
async def simulate_subsystem_failure(
    failure_type: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """Simulates an explicit subsystem exception (e.g. stream_disconnect, prediction_drift)."""
    state = SimulatedResilienceState
    
    if failure_type == "stream_disconnect":
        state.exceptions_count = 6
        state.degradation_duration = 35.0
        state.retry_count = 4
        state.sync_gap = 14
        state.isolated_subsystems = ["Stream Transport Broker"]
        state.divergent_keys = ["matchScore"]
    elif failure_type == "prediction_drift":
        state.exceptions_count = 5
        state.degradation_duration = 20.0
        state.retry_count = 0
        state.sync_gap = 2
        state.isolated_subsystems = ["Prediction Engine"]
        state.divergent_keys = ["matchScore", "careerVelocity"]
    else:
        # Generic load overload
        state.exceptions_count = 8
        state.degradation_duration = 50.0
        state.retry_count = 2
        state.sync_gap = 18
        state.isolated_subsystems = ["Prediction Engine", "Stream Transport Broker"]
        state.divergent_keys = ["matchScore", "careerVelocity", "marketFit"]

    return {
        "status": "TRIGGERED",
        "failure_type_simulated": failure_type,
        "isolated_subsystems": state.isolated_subsystems,
        "message": f"Successfully simulated '{failure_type}' subsystem exception. Active containment rules applied."
    }

@router.post("/recover")
async def trigger_resilience_recovery(
    current_user: User = Depends(get_current_user)
):
    """Forcefully triggers manual re-synchronization, replaying, and rebalancing recovery actions."""
    state = SimulatedResilienceState
    
    # Re-align simulated variables to stable states
    state.exceptions_count = 0
    state.degradation_duration = 0.0
    state.retry_count = 0
    state.sync_gap = 1
    state.isolated_subsystems = []
    state.divergent_keys = []

    return {
        "status": "RECOVERED",
        "reconstruction_timestamp": int(time.time()),
        "message": "State checkpoints fully replayed. All isolated subsystems re-connected successfully."
    }
