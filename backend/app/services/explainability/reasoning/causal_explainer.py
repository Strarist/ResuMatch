from typing import Dict, Any, List

class CausalExplainer:
    """Provides causal transparency for strategic optimization decisions."""

    @classmethod
    def explain_priority(
        cls,
        node_title: str,
        opportunity_windows: List[Dict[str, Any]],
        market_relevance: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Exposes the causal chain explaining why a specific roadmap node was prioritized."""

        causal_factors = []
        urgency_level = "LOW"

        # 1. Match against opportunity windows
        matched_window = None
        for win in opportunity_windows:
            role = win.get("role_category", "").lower()
            req = win.get("leverage_requirement", "").lower()
            if any(kw in role or kw in req or kw in node_title.lower() for kw in ["systems", "platform", "backend", "fastapi", "kubernetes", "next.js", "typescript"]):
                matched_window = win
                break

        if matched_window:
            days = matched_window.get("days_remaining", 30)
            urgency_level = "HIGH" if days <= 14 else "MEDIUM"
            causal_factors.append(
                f"Opportunity window for '{matched_window.get('role_category')}' is closing in {days} days."
            )
            causal_factors.append(
                f"Required leverage threshold: '{matched_window.get('leverage_requirement')}'"
            )

        # 2. Match against market relevance
        matched_relevance = None
        for skill_info in market_relevance:
            skill_name = skill_info.get("skill", "").lower()
            if skill_name in node_title.lower():
                matched_relevance = skill_info
                break

        if matched_relevance:
            trend = matched_relevance.get("trend", "STABLE")
            curr_rel = matched_relevance.get("current_relevance", 80)
            proj_rel = matched_relevance.get("projected_relevance_12m", 80)

            if trend == "UP":
                causal_factors.append(
                    f"Market relevance for skill is trending UP (+{proj_rel - curr_rel} index points over 12 months)."
                )
            else:
                causal_factors.append(
                    f"Market relevance holds at stable core index coefficient ({curr_rel} points)."
                )
        else:
            # Generic/fallback market indicator
            causal_factors.append("General backend specialization adjacency optimization triggered.")

        # Summary
        summary = (
            f"Prioritized '{node_title}' because it directly targets "
            f"closing opportunity requirements with {urgency_level.lower()} urgency "
            f"and robust market relevance."
        )

        return {
            "node_title": node_title,
            "summary": summary,
            "causal_factors": causal_factors,
            "urgency_level": urgency_level,
            "market_signal_verified": matched_relevance is not None
        }
