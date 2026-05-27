from typing import Dict, Any
from app.services.observability.shared.diagnostics_protocols import DiagnosticsProvider
from app.services.observability.shared.observability_models import ReplayAudit
from app.services.observability.replay.determinism_audit import ReplayDeterminismAuditor
from app.services.observability.replay.snapshot_validator import ReplaySnapshotValidator
from app.services.observability.replay.divergence_tracker import ReplayDivergenceTracker

class ReplayDeterminismAuditorEngine(DiagnosticsProvider):
    """Orchestrates transition checking, snapshot validating, and divergence tracking into a ReplayAudit."""

    def diagnose(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Runs complete replay determinism audits.
        
        Args:
            data (Dict[str, Any]): Replay diagnostics payload containing:
                - reference_run (Dict[str, Any]): Reference execution run details.
                - replay_run (Dict[str, Any]): Replayed execution run details.
                - snapshot (Dict[str, Any]): Memory snapshot payload.
                - expected_checksum (str): Snapshot target hash sum.
        """
        ref_run = data.get("reference_run", {"transitions": ["INIT", "OPTIMIZE", "SAVE"]})
        rep_run = data.get("replay_run", {"transitions": ["INIT", "OPTIMIZE", "SAVE"]})
        snapshot = data.get("snapshot", {"matchScore": 94.0})
        expected_checksum = data.get("expected_checksum", "")

        if not expected_checksum:
            expected_checksum = ReplaySnapshotValidator.compute_hash(snapshot)

        # 1. Run sub-audits
        det_info = ReplayDeterminismAuditor.audit_determinism(ref_run, rep_run)
        snap_info = ReplaySnapshotValidator.validate_snapshot(snapshot, expected_checksum)
        div_info = ReplayDivergenceTracker.identify_divergence(
            ref_run.get("state", {}), rep_run.get("state", {})
        )

        # 2. Package into ReplayAudit Pydantic output
        overall_reproducible = det_info["determinism_score"] > 0.85 and snap_info["is_valid"]
        
        audit = ReplayAudit(
            determinism_index=det_info["determinism_score"],
            snapshot_integrity_score=snap_info["integrity_score"],
            divergence_count=div_info["divergence_count"],
            reproducibility_intact=overall_reproducible
        )

        return audit.model_dump()
