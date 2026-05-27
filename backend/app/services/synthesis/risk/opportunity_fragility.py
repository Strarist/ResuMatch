from typing import Dict, Any, List
from app.services.synthesis.shared.synthesis_rules import OPPORTUNITY_URGENCY_DAYS_LIMIT

class OpportunityFragilityEngine:
    """Gauges high-risk closing opportunity windows and critical timelines."""

    @staticmethod
    def evaluate_fragility(
        closing_days: int = 10,
        unresponsive_leads: int = 0
    ) -> Dict[str, Any]:
        """
        Synthesizes opportunity fragility and timeline pressures.
        
        Args:
            closing_days (int): Days remaining on highest-priority target opportunity window.
            unresponsive_leads (int): Count of contact leads that are currently stale/unresponsive.
        """
        is_urgent = closing_days <= OPPORTUNITY_URGENCY_DAYS_LIMIT
        fragility_score = round(min(1.0, (OPPORTUNITY_URGENCY_DAYS_LIMIT - closing_days) / OPPORTUNITY_URGENCY_DAYS_LIMIT + (unresponsive_leads * 0.1)), 2)

        triggers = []
        actions = []

        if is_urgent:
            triggers.append(f"Target window closing in {closing_days} days")
            actions.append("Initiate priority high-touch outreach bypass protocol immediately")
        if unresponsive_leads > 3:
            triggers.append(f"{unresponsive_leads} unresponsive lead contacts detected")
            actions.append("Shift outreach trajectory to secondary backup recruiters")

        return {
            "fragility_score": max(0.0, fragility_score),
            "is_urgent": is_urgent,
            "triggers": triggers,
            "reconstruction_actions": actions
        }
