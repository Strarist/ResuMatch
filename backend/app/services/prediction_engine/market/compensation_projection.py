from typing import Dict, Any, List

class CompensationProjector:
    """Models compensation percentiles based on stack alignment levels."""

    @staticmethod
    def project_salary(skills: List[str], base_salary: float = 120000.0) -> Dict[str, Any]:
        hot_skills = {"fastapi", "next.js", "kubernetes", "redis", "postgresql"}
        matched = [s for s in skills if s.lower() in hot_skills]

        # Incremental boost per premium skill
        boost = len(matched) * 10000.0
        projected = base_salary + boost

        return {
            "base_market_salary": base_salary,
            "projected_market_salary": projected,
            "growth_delta": boost,
            "percentile": min(95, int(75 + len(matched) * 4))
        }
