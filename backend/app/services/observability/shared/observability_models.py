from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional

class OrchestrationHealth(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    runtime_stability_score: float      # 0.0 to 1.0
    propagation_integrity_score: float  # 0.0 to 1.0
    topology_coherence_score: float     # 0.0 to 1.0
    orchestration_latency: float         # in milliseconds
    degraded_cycle_count: int
    replay_alignment_score: float       # 0.0 to 1.0

class PredictionDrift(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    drift_coefficient: float            # 0.0 to 1.0
    confidence_decay_rate: float        # 0.0 to 1.0
    calibration_stability: float        # 0.0 to 1.0
    drift_diagnostics: str

class ReplayAudit(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    determinism_index: float            # 0.0 to 1.0
    snapshot_integrity_score: float     # 0.0 to 1.0
    divergence_count: int
    reproducibility_intact: bool

class TransportHealth(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    uptime_ratio: float                 # 0.0 to 1.0
    reconnect_frequency: float          # average disconnects per hour
    payload_corruption_rate: float      # 0.0 to 1.0
    synchronization_delay_ms: float     # average delay in ms
    heartbeat_quality: float            # 0.0 to 1.0

class RuntimeHealth(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    memory_consumption_mb: float
    memory_limit_mb: float
    async_task_cancellations: int
    performance_degradation_score: float # 0.0 to 1.0
    system_load_percent: float          # 0.0 to 100.0

class RuntimeTrustVector(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    orchestration_trust: float          # 0.0 to 1.0
    prediction_trust: float             # 0.0 to 1.0
    replay_trust: float                 # 0.0 to 1.0
    synchronization_trust: float        # 0.0 to 1.0
    transport_trust: float              # 0.0 to 1.0
    overall_runtime_trust: float        # Weighted combination 0.0 to 1.0
