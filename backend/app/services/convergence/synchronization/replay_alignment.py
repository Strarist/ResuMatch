from typing import Dict, Any, List
from app.services.convergence.shared.calibration_protocols import ConvergenceProvider
from app.services.convergence.shared.convergence_models import ReplayAlignmentState
from app.services.convergence.synchronization.synchronization_refiner import SynchronizationRefiner
from app.services.convergence.synchronization.delta_optimizer import DeltaOptimizer
from app.services.convergence.synchronization.transport_compaction import TransportCompactor

class ReplayAlignmentEngine(ConvergenceProvider):
    """Orchestrates synchronization refiners, state delta optimizations, and serialization compactors."""
    
    def mitigate(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Runs full replay alignment.
        
        Args:
            data (Dict[str, Any]): Replay metrics containing:
                - sync_gap (int): lag elements.
                - divergent_keys (List[str]): active telemetry drift parameters.
                - payload_size_kb (float): SSE packet size.
                - aligned_snapshots_count (int): active aligned snapshots.
        """
        sync_gap = data.get("sync_gap", 5)
        divergent_keys = data.get("divergent_keys", [])
        payload_size_kb = data.get("payload_size_kb", 15.0)
        snapshots_count = data.get("aligned_snapshots_count", 12)
        
        # 1. Run sub-optimizations
        sync_info = SynchronizationRefiner.refine_sync(sync_gap)
        delta_info = DeltaOptimizer.optimize_deltas(divergent_keys)
        trans_info = TransportCompactor.compact_transport(payload_size_kb)
        
        # Determine if alignment is highly coherent
        is_coherent = sync_gap <= 2 and len(divergent_keys) <= 2
        
        state = ReplayAlignmentState(
            replay_determinism_index=1.0 if is_coherent else 0.88,
            catchup_alignment_cycles=sync_info["target_alignment_cycles"],
            delta_compression_ratio=delta_info["compression_ratio"],
            transport_packet_compaction_rate=trans_info["compaction_ratio"],
            aligned_snapshots_count=snapshots_count,
            is_alignment_coherent=is_coherent
        )
        
        return state.model_dump()
