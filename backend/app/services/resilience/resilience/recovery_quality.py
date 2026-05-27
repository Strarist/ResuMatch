from typing import List, Dict, Any

class RecoveryQualityScorer:
    """Evaluates recovery actions success and calculates restoration quality coefficients."""

    @staticmethod
    def audit_quality(recovery_actions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Gauges the efficiency of recovery executions.
        
        Args:
            recovery_actions (List[Dict[str, Any]]): Logged chronological recovery actions.
        """
        if not recovery_actions:
            return {
                "recovery_quality": 1.0,
                "success_ratio": 1.0
            }

        successes = sum(1 for a in recovery_actions if a.get("reconstruction_successful") is True)
        total = len(recovery_actions)

        ratio = round(successes / total, 2)
        
        return {
            "recovery_quality": ratio,
            "success_ratio": ratio
        }
