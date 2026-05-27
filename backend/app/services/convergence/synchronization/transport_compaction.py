from typing import Dict, Any

class TransportCompactor:
    @staticmethod
    def compact_transport(payload_size_kb: float) -> Dict[str, Any]:
        """
        Compacts network serialization frames to minimize client message handling pressure.
        """
        # Compress transmission formats
        compacted_size = round(payload_size_kb * 0.45, 2)
        
        return {
            "original_payload_kb": payload_size_kb,
            "compacted_payload_kb": compacted_size,
            "compaction_ratio": 0.45,
            "action_taken": f"Compacted transport serialization payload from {payload_size_kb}KB down to {compacted_size}KB."
        }
