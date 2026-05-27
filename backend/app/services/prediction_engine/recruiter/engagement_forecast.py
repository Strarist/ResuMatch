from typing import List, Dict, Any
import random

class RecruiterEngagementForecaster:
    """Projects search volume and profile activity cycles."""

    @staticmethod
    def forecast_engagement(metrics: dict, weeks: int = 12) -> List[Dict[str, Any]]:
        recruiter_conf = metrics.get("recruiterConfidence", 87.0)

        forecast = []
        for week in range(1, weeks + 1):
            # Simulate slight random variations on top of confidence-driven trends
            var = random.uniform(-2, 3)
            weekly_searches = max(5, int((recruiter_conf * 0.4) + (week * 0.8) + var))
            weekly_clicks = max(1, int(weekly_searches * 0.15 + (random.random() * 2)))

            forecast.append({
                "week": week,
                "search_appearances": weekly_searches,
                "profile_views": weekly_clicks
            })

        return forecast
