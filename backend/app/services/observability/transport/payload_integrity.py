from typing import Dict, Any, List

class PayloadIntegrityScanner:
    """Scans and parses transmission event payloads to measure corruption and verification failure rates."""

    @staticmethod
    def scan_payloads(payload_events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes payload validation checks.
        
        Args:
            payload_events (List[Dict[str, Any]]): Logged event checks with corruption indicators.
        """
        if not payload_events:
            return {
                "corruption_rate": 0.0,
                "corrupted_count": 0,
                "verified_count": 0
            }

        corrupted = sum(1 for e in payload_events if e.get("corrupted") is True)
        total = len(payload_events)
        
        rate = round(corrupted / total, 3)

        return {
            "corruption_rate": rate,
            "corrupted_count": corrupted,
            "verified_count": total - corrupted
        }
