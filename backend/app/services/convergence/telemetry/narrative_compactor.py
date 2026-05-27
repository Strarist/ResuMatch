from typing import Dict, Any

class NarrativeCompactor:
    @staticmethod
    def compact_narratives(narrative_tokens_count: int) -> Dict[str, Any]:
        """
        Compacts high-density strategic narratives to avoid context window pollution.
        """
        # Compress tokens count
        compacted = max(150, int(narrative_tokens_count * 0.40))
        
        return {
            "tokens_before": narrative_tokens_count,
            "tokens_after": compacted,
            "compression_ratio": round(compacted / narrative_tokens_count, 2) if narrative_tokens_count > 0 else 1.0
        }
