from typing import List, Dict, Any

class SkillRelevanceForecaster:
    """Projects tech domain skill relevance indices over a 12-month horizon."""

    @staticmethod
    def forecast_skills() -> List[Dict[str, Any]]:
        # Static forecast values representing market projections
        return [
            {"skill": "FastAPI", "current_relevance": 92, "projected_relevance_12m": 98, "trend": "UP"},
            {"skill": "Next.js", "current_relevance": 88, "projected_relevance_12m": 94, "trend": "UP"},
            {"skill": "TypeScript", "current_relevance": 95, "projected_relevance_12m": 97, "trend": "STABLE"},
            {"skill": "Django", "current_relevance": 72, "projected_relevance_12m": 64, "trend": "DOWN"},
            {"skill": "Flask", "current_relevance": 65, "projected_relevance_12m": 52, "trend": "DOWN"},
            {"skill": "Redis", "current_relevance": 85, "projected_relevance_12m": 90, "trend": "UP"}
        ]
