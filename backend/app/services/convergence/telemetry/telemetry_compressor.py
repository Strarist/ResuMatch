from typing import Dict, Any
from app.services.convergence.shared.calibration_protocols import ConvergenceProvider
from app.services.convergence.shared.convergence_models import CompressedTelemetry
from app.services.convergence.telemetry.observability_refiner import ObservabilityRefiner
from app.services.convergence.telemetry.signal_deduplicator import SignalDeduplicator
from app.services.convergence.telemetry.narrative_compactor import NarrativeCompactor

class TelemetryCompressionEngine(ConvergenceProvider):
    """Orchestrates observability trace filters, repetitive status deduplications, and narrative token compactions."""
    
    def mitigate(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Runs full telemetry compression.
        
        Args:
            data (Dict[str, Any]): Telemetry metrics containing:
                - original_traces_count (int): baseline logging lines.
                - repeated_checks (int): duplicates signals count.
                - narrative_tokens_count (int): context words count.
        """
        traces = data.get("original_traces_count", 120)
        checks = data.get("repeated_checks", 80)
        tokens = data.get("narrative_tokens_count", 400)
        
        # 1. Run sub-optimizations
        obs_info = ObservabilityRefiner.refine_observability(traces)
        dedup_info = SignalDeduplicator.deduplicate_signals(checks)
        narr_info = NarrativeCompactor.compact_narratives(tokens)
        
        # Compute overall savings
        original_sum = traces + checks
        compacted_sum = obs_info["refined_traces"] + dedup_info["deduplicated_checks_count"]
        savings_pct = round((original_sum - compacted_sum) / original_sum, 2) if original_sum > 0 else 0.0
        
        state = CompressedTelemetry(
            original_signals_count=original_sum,
            compacted_signals_count=compacted_sum,
            telemetry_savings_percentage=savings_pct,
            signal_priority="HIGH" if savings_pct > 0.5 else "MEDIUM",
            operational_importance=0.92,
            replay_relevance=0.96,
            trust_impact=0.88,
            compression_reason="Trace filters and periodic signal deduplication applied successfully."
        )
        
        return state.model_dump()
