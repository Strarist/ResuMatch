from typing import Dict, Any, List

class LeverageForecaster:
    """Calculates potential trajectory target leverage opportunities."""

    @staticmethod
    def forecast_leverage_pivots(skills: List[str], metrics: dict) -> List[Dict[str, Any]]:
        pivots = []
        market_fit = metrics.get("marketFit", 91.0)

        # Scenario 1: Python/FastAPI mastery
        if "fastapi" in [s.lower() for s in skills] or "python" in [s.lower() for s in skills] or not skills:
            pivots.append({
                "pivot_name": "Distributed System Optimization",
                "impact": "High",
                "estimated_shift": "+12% Career Velocity",
                "required_action": "Deploy high-throughput asynchronous message queue project to GitHub."
            })

        # Scenario 2: TypeScript/Next.js/React mastery
        if "next.js" in [s.lower() for s in skills] or "typescript" in [s.lower() for s in skills] or not skills:
            pivots.append({
                "pivot_name": "Full-Stack Rendering Acceleration",
                "impact": "Medium",
                "estimated_shift": "+8% Match Score",
                "required_action": "Implement partial hydration and Server Component architecture in portfolio."
            })

        # Fallback pivot
        pivots.append({
            "pivot_name": "Outreach Rhythm Calibration",
            "impact": "High",
            "estimated_shift": "+15% Recruiter Visibility",
            "required_action": "Target 10 engineering managers weekly with custom causal graph metrics."
        })

        return pivots
