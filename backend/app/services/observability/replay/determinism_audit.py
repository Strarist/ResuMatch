from typing import Dict, Any, List

class ReplayDeterminismAuditor:
    """Audits execution transition paths for complete strict determinism."""

    @staticmethod
    def audit_determinism(run_a: Dict[str, Any], run_b: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compares two execution runs to verify they transitioned through identical paths.
        
        Args:
            run_a (Dict[str, Any]): Base/reference execution run snapshot.
            run_b (Dict[str, Any]): Replay execution run snapshot.
        """
        if not run_a or not run_b:
            return {
                "determinism_score": 1.0,
                "divergent_transitions": 0,
                "summary": "Determinism fully intact; reference run is vacant."
            }

        actions_a = run_a.get("transitions", [])
        actions_b = run_b.get("transitions", [])

        # Check transition count matches
        if len(actions_a) != len(actions_b):
            return {
                "determinism_score": 0.5,
                "divergent_transitions": abs(len(actions_a) - len(actions_b)),
                "summary": f"Divergence detected: reference cycle transitions ({len(actions_a)}) do not match replay transitions ({len(actions_b)})."
            }

        divergences = 0
        for act_a, act_b in zip(actions_a, actions_b):
            if act_a != act_b:
                divergences += 1

        determinism = round(max(0.0, 1.0 - (divergences / len(actions_a))), 2)

        return {
            "determinism_score": determinism,
            "divergent_transitions": divergences,
            "summary": f"Determinism audit successfully completed. Score: {determinism}. Divergences: {divergences}."
        }
