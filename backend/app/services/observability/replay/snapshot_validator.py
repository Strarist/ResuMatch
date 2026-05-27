import hashlib
import json
from typing import Dict, Any

class ReplaySnapshotValidator:
    """Computes check sums on memory snapshots to confirm database and state integrity."""

    @staticmethod
    def compute_hash(snapshot: Dict[str, Any]) -> str:
        """Serializes snapshot payload to stable json and yields a SHA-256 check sum."""
        serialized = json.dumps(snapshot, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    @classmethod
    def validate_snapshot(cls, snapshot: Dict[str, Any], expected_checksum: str) -> Dict[str, Any]:
        """
        Validates check sum integrity of a serialized state snapshot.
        
        Args:
            snapshot (Dict[str, Any]): State snapshot payload.
            expected_checksum (str): Target reference SHA-256 check sum.
        """
        if not snapshot:
            return {
                "is_valid": False,
                "integrity_score": 0.0,
                "calculated_checksum": "",
                "error": "Snapshot payload is empty."
            }

        calculated = cls.compute_hash(snapshot)
        is_valid = calculated == expected_checksum
        
        return {
            "is_valid": is_valid,
            "integrity_score": 1.0 if is_valid else 0.2,
            "calculated_checksum": calculated
        }
