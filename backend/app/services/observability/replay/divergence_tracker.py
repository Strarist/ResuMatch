from typing import Dict, Any, List

class ReplayDivergenceTracker:
    """Tracks dynamic state deviations and delta divergence events between runs."""

    @staticmethod
    def identify_divergence(state_ref: Dict[str, Any], state_rep: Dict[str, Any]) -> Dict[str, Any]:
        """
        Pinpoints exact keys and value gaps between state reference and replay snapshots.
        
        Args:
            state_ref (Dict[str, Any]): Reference execution state attributes.
            state_rep (Dict[str, Any]): Replayed execution state attributes.
        """
        if not state_ref or not state_rep:
            return {
                "has_diverged": False,
                "divergence_count": 0,
                "divergent_keys": []
            }

        divergent_keys = []
        for key in state_ref:
            if key in state_rep:
                if state_ref[key] != state_rep[key]:
                    divergent_keys.append(key)
            else:
                divergent_keys.append(key)

        for key in state_rep:
            if key not in state_ref:
                divergent_keys.append(key)

        return {
            "has_diverged": len(divergent_keys) > 0,
            "divergence_count": len(divergent_keys),
            "divergent_keys": sorted(list(set(divergent_keys)))
        }
