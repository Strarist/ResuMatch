from typing import Dict, Any, List
from app.services.prediction_engine.predictive_memory import PredictiveMemoryLayer

class PredictiveCalibrationEngine:
    """Evaluates prediction-to-actual metric divergence and computes self-calibrating scaling coefficients."""

    @classmethod
    def calculate_divergence_metrics(cls) -> Dict[str, Any]:
        """Scans memory history to compute average error margins for key metrics."""
        snapshots = PredictiveMemoryLayer.get_snapshots()
        comparisons = [s for s in snapshots if s.get("accuracy_metric") is not None]

        if not comparisons:
            return {
                "total_calibrated_points": 0,
                "average_overall_divergence": 0.0,
                "error_by_dimension": {
                    "matchScore": 0.0,
                    "careerVelocity": 0.0,
                    "marketFit": 0.0,
                    "recruiterConfidence": 0.0
                }
            }

        total = len(comparisons)
        errors = {"matchScore": 0.0, "careerVelocity": 0.0, "marketFit": 0.0, "recruiterConfidence": 0.0}
        counts = {"matchScore": 0, "careerVelocity": 0, "marketFit": 0, "recruiterConfidence": 0}

        for snap in comparisons:
            predicted = snap["results"].get("metrics", {})
            actual = snap.get("actual_outcome_compared", {})

            for key in errors.keys():
                p_val = predicted.get(key)
                a_val = actual.get(key)
                if p_val is not None and a_val is not None:
                    # absolute percentage difference
                    base = max(1.0, float(p_val))
                    errors[key] += abs(p_val - a_val) / base
                    counts[key] += 1

        avg_errors = {}
        for key, val in errors.items():
            count = counts[key]
            avg_errors[key] = round(val / count, 3) if count > 0 else 0.0

        overall_divergence = round(sum(avg_errors.values()) / len(avg_errors), 3)

        return {
            "total_calibrated_points": total,
            "average_overall_divergence": overall_divergence,
            "error_by_dimension": avg_errors
        }

    @classmethod
    def get_calibration_coefficients(cls) -> Dict[str, float]:
        """Returns multiplier coefficients to dynamically align model heuristics with reality."""
        divergence = cls.calculate_divergence_metrics()
        errors = divergence["error_by_dimension"]

        # Default scale factor: 1.0 (no change)
        coefficients = {
            "match_score_coeff": 1.0,
            "velocity_coeff": 1.0,
            "market_fit_coeff": 1.0,
            "recruiter_conf_coeff": 1.0
        }

        if divergence["total_calibrated_points"] == 0:
            return coefficients

        # Adjust modifiers: if error is high (e.g. 10% overestimate), scale down future predictions.
        # If actual outcome matches predictions closely, coefficient stays near 1.0.
        # We limit the scale adjustment between 0.75 and 1.15 to ensure stable convergence.
        coefficients["match_score_coeff"] = round(max(0.75, min(1.15, 1.0 - errors.get("matchScore", 0.0) * 0.8)), 3)
        coefficients["velocity_coeff"] = round(max(0.75, min(1.15, 1.0 - errors.get("careerVelocity", 0.0) * 0.8)), 3)
        coefficients["market_fit_coeff"] = round(max(0.75, min(1.15, 1.0 - errors.get("marketFit", 0.0) * 0.8)), 3)
        coefficients["recruiter_conf_coeff"] = round(max(0.75, min(1.15, 1.0 - errors.get("recruiterConfidence", 0.0) * 0.8)), 3)

        return coefficients
