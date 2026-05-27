from typing import Dict, Any

class SignalDeduplicator:
    @staticmethod
    def deduplicate_signals(repeated_checks: int) -> Dict[str, Any]:
        """
        Deduplicates repeated healthy metrics indicators to compact state payload feeds.
        """
        # Compress high-frequency indicators
        deduplicated = max(2, int(repeated_checks * 0.05))
        
        return {
            "original_checks_count": repeated_checks,
            "deduplicated_checks_count": deduplicated,
            "savings_count": repeated_checks - deduplicated
        }
