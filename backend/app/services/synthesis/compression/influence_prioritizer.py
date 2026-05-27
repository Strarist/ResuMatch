from typing import List, Dict, Any

class InfluencePrioritizer:
    """Prioritizes and isolates the most powerful signal factors impacting predictions."""

    @staticmethod
    def extract_top_influences(influence_chain: Dict[str, Any], limit: int = 2) -> List[Dict[str, Any]]:
        """Sorts active influence factors and extracts the highest-magnitude contributors."""
        weightings = influence_chain.get("weighting_breakdown", {})
        
        factors = []
        for key, val in weightings.items():
            factors.append({
                "factor_name": key.replace("_importance", ""),
                "importance_weight": val,
                "impact_direction": "POSITIVE" if val > 0 else "NEGATIVE"
            })
            
        # Sort by absolute weight descending
        factors.sort(key=lambda x: abs(x["importance_weight"]), reverse=True)
        return factors[:limit]
