from typing import Dict, Any

class RiskModel:
    """Calculates career stagnant/redundancy risk factors."""

    @staticmethod
    def calculate_risk(metrics: dict, execution_consistency: float) -> Dict[str, Any]:
        career_vel = metrics.get("careerVelocity", 78.0)

        # Stagnation risk is inversely proportional to velocity and consistency
        stagnation = max(0.05, min(0.95, 1.0 - (career_vel / 100.0) * 0.7 - execution_consistency * 0.2))

        # Redundancy risk indexes skill decay (simulated value)
        market_fit = metrics.get("marketFit", 91.0)
        redundancy = max(0.05, min(0.95, 1.0 - (market_fit / 100.0)))

        return {
            "stagnation_risk_ratio": round(stagnation, 2),
            "skill_redundancy_risk": round(redundancy, 2),
            "aggregate_risk_score": round((stagnation + redundancy) / 2.0, 2)
        }
