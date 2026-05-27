from pydantic import BaseModel, Field
from typing import List, Dict, Any

class OrchestrationConvergenceState(BaseModel):
    redundant_paths_identified: List[str] = Field(default_factory=list)
    simplified_propagation_chains: List[str] = Field(default_factory=list)
    optimized_queue_depth: int = Field(default=20)
    topology_depth_before: int = Field(default=8)
    topology_depth_after: int = Field(default=4)
    simplification_percentage: float = Field(default=0.0)

class ReplayAlignmentState(BaseModel):
    replay_determinism_index: float = Field(default=1.0)
    catchup_alignment_cycles: int = Field(default=1)
    delta_compression_ratio: float = Field(default=1.0)
    transport_packet_compaction_rate: float = Field(default=1.0)
    aligned_snapshots_count: int = Field(default=10)
    is_alignment_coherent: bool = Field(default=True)

class CompressedTelemetry(BaseModel):
    original_signals_count: int = Field(default=100)
    compacted_signals_count: int = Field(default=10)
    telemetry_savings_percentage: float = Field(default=0.0)
    signal_priority: str = Field(default="HIGH")
    operational_importance: float = Field(default=0.9)
    replay_relevance: float = Field(default=0.95)
    trust_impact: float = Field(default=0.85)
    compression_reason: str = Field(default="Redundant observabilities compacted.")

class ReliabilityCalibrationState(BaseModel):
    calibrated_trust_score: float = Field(default=0.98)
    resilience_retry_cooldown_seconds: float = Field(default=30.0)
    adjusted_degradation_latency_ms: float = Field(default=250.0)
    adjusted_degradation_memory_mb: float = Field(default=400.0)
    calibration_applied: bool = Field(default=False)
    calibration_pacing_cooldown_active: bool = Field(default=False)

class PruningRecommendation(BaseModel):
    dead_abstractions: List[str] = Field(default_factory=list)
    overlapping_services: List[str] = Field(default_factory=list)
    obsolete_helpers: List[str] = Field(default_factory=list)
    estimated_loc_saved: int = Field(default=0)
    pruning_safety_score: float = Field(default=1.0)

class ConvergenceSummary(BaseModel):
    overall_coherence_index: float = Field(default=0.95)
    simplification_percentage: float = Field(default=0.0)
    telemetry_reduction_ratio: float = Field(default=1.0)
    trust_calibration_factor: float = Field(default=1.0)
    restoration_confidence: float = Field(default=1.0)
    rebalancing_applied: bool = Field(default=False)
