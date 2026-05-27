from typing import List, Dict, Any

class SimulationConsistencyMonitor:
    """Measures variance and consistency indices across sequential simulation outputs."""

    @staticmethod
    def evaluate_consistency(simulation_runs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates volatility and reproducibility scores across multiple simulation snapshots.
        
        Args:
            simulation_runs (List[Dict[str, Any]]): List of repetitive simulation run outputs.
        """
        if not simulation_runs or len(simulation_runs) < 2:
            return {
                "consistency_score": 1.0,
                "volatility": 0.0,
                "summary": "Simulation outputs are consistent. No current volatility detected."
            }

        # Calculate standard deviation/variance on a representative score (e.g. success_probability or score)
        scores = []
        for run in simulation_runs:
            results = run.get("results", {})
            metrics = results.get("metrics", {})
            score = metrics.get("matchScore") or run.get("score")
            if score is not None:
                scores.append(float(score))

        if len(scores) < 2:
            return {
                "consistency_score": 1.0,
                "volatility": 0.0,
                "summary": "Insufficient data points; baseline consistency assumed."
            }

        mean = sum(scores) / len(scores)
        variance = sum((x - mean) ** 2 for x in scores) / len(scores)
        standard_dev = variance ** 0.5

        # Bounded score: higher SD lowers consistency
        consistency = round(max(0.1, 1.0 - (standard_dev / 10.0)), 2)

        return {
            "consistency_score": consistency,
            "volatility": round(standard_dev, 2),
            "summary": f"Audited {len(scores)} runs. Statistical consistency coefficient stands at {consistency}."
        }
