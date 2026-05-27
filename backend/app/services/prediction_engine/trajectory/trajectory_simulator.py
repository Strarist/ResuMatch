class TrajectorySimulator:
    """Simulates strategic career projections based on parameter inputs."""

    @staticmethod
    def simulate_path(
        current_metrics: dict,
        improved_skills: list,
        shipped_projects: int,
        outreach_frequency: float, # 0.0 to 1.0
        execution_consistency: float # 0.0 to 1.0
    ) -> dict:
        # Base values
        match_score = current_metrics.get("matchScore", 94.0)
        career_vel = current_metrics.get("careerVelocity", 78.0)
        market_fit = current_metrics.get("marketFit", 91.0)
        recruiter_conf = current_metrics.get("recruiterConfidence", 87.0)

        # 1. Skill alignment boosts market fit
        skill_boost = len(improved_skills) * 2.5
        new_market_fit = min(99.9, market_fit + skill_boost)

        # 2. Shipping projects increases consistency and visibility
        project_boost = shipped_projects * 3.0
        new_match_score = min(99.9, match_score + (project_boost * 0.5))
        new_career_vel = min(99.9, career_vel + (execution_consistency * 12.0) + (project_boost * 0.8))

        # 3. Outreach rates drive recruiter confidence
        new_recruiter_conf = min(99.9, recruiter_conf + (outreach_frequency * 20.0) - (5.0 if outreach_frequency < 0.2 else 0.0))

        # Calculate leverage gain
        leverage_gain = (new_market_fit - market_fit) + (new_career_vel - career_vel) * 0.5

        # Strategic risk score (declines as velocity and alignment improve)
        risk = max(0.05, min(0.95, 1.0 - (new_career_vel * 0.005) - (new_market_fit * 0.005)))

        # Generate reasoning chain
        reasoning = []
        if improved_skills:
            reasoning.append(f"Acquiring {', '.join(improved_skills)} closes {len(improved_skills)} strategic market skill gaps, shifting alignment by +{skill_boost:0.1f}%.")
        if shipped_projects > 0:
            reasoning.append(f"Shipping {shipped_projects} validated engineering achievements accelerates execution velocity and expands role adjacency.")
        if outreach_frequency > 0.5:
            reasoning.append("High outreach consistency stimulates recruiter search activity, boosting visibility bounds.")
        if execution_consistency > 0.8:
            reasoning.append("Consistent execution reliability minimizes stagnation risk coefficients.")
        else:
            reasoning.append("Sub-nominal execution consistency indexes higher career velocity decay.")

        return {
            "probability_score": round(min(0.99, max(0.1, 0.4 + (new_recruiter_conf * 0.003) + (new_market_fit * 0.003))), 2),
            "leverage_gain": f"+{leverage_gain:0.1f}%",
            "market_alignment_shift": f"+{skill_boost:0.1f}%",
            "recruiter_visibility_delta": f"+{(new_recruiter_conf - recruiter_conf) * 1.5:0.1f}%",
            "estimated_execution_cost": "High" if len(improved_skills) > 3 or shipped_projects > 2 else "Medium",
            "strategic_risk_score": f"{'High' if risk > 0.6 else 'Medium' if risk > 0.3 else 'Low'} ({risk:0.2f})",
            "reasoning_chain": reasoning,
            "metrics": {
                "matchScore": round(new_match_score, 1),
                "careerVelocity": round(new_career_vel, 1),
                "marketFit": round(new_market_fit, 1),
                "recruiterConfidence": round(new_recruiter_conf, 1)
            }
        }
