from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional

class FailureContainmentState(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    isolated_subsystems: List[str]
    propagation_lockdowns: List[str]
    degraded_services: List[str]
    recovery_priority: str              # CRITICAL, HIGH, MEDIUM, LOW
    containment_reason: str
    runtime_risk_score: float           # 0.0 to 1.0

class DegradationState(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    active_profile: str                 # OPTIMAL, COMPRESSED, MINIMAL
    expensive_telemetry_disabled: bool
    synthesis_density: str              # FULL, COMPRESSED, MINIMAL
    prediction_pacing_seconds: float
    transport_broadcast_rate: float     # 0.0 to 1.0

class RecoveryAction(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    component_name: str
    action_taken: str
    reconstruction_successful: bool
    restoration_timestamp: float

class ResilienceVector(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    containment_quality: float          # 0.0 to 1.0
    recovery_quality: float             # 0.0 to 1.0
    degradation_stability: float        # 0.0 to 1.0
    orchestration_resilience: float     # 0.0 to 1.0
    transport_resilience: float         # 0.0 to 1.0
    overall_survivability: float        # Weighted combination 0.0 to 1.0
