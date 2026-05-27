from typing import Dict, Any

class OutreachModel:
    """Calculates conversion metrics for job search campaigns."""

    @staticmethod
    def simulate_funnel(contacts: int, response_rate: float) -> Dict[str, Any]:
        replies = int(contacts * response_rate)
        interviews = int(replies * 0.35)
        offers = int(interviews * 0.2)

        return {
            "initial_contacts": contacts,
            "projected_replies": replies,
            "projected_interviews": max(0, interviews),
            "projected_offers": max(0, offers),
            "funnel_efficiency_score": round((offers / contacts if contacts > 0 else 0) * 100, 1)
        }
