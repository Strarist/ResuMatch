from typing import Dict, Any, List
from app.services.synthesis.shared.synthesis_protocols import SynthesisProvider
from app.services.synthesis.shared.synthesis_models import OpportunityClusterModel
from app.services.synthesis.opportunity.leverage_summary import LeverageSummaryEngine
from app.services.synthesis.opportunity.recruiter_positioning import RecruiterPositioningEngine
from app.services.synthesis.opportunity.market_positioning import MarketPositioningEngine

class OpportunitySynthesisEngine(SynthesisProvider):
    """Orchestrates market, recruiter, and leverage submodules to formulate strategic opportunity clusters."""

    def synthesize(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Synthesizes opportunity matrices and leverage clusters based on raw simulation outcomes.
        
        Args:
            data (Dict[str, Any]): Predictive or simulation payload containing:
                - metrics (Dict[str, float]): Core trajectory metrics.
                - improved_skills (List[str]): List of newly acquired or targeted skills.
                - recruiter_prob (Dict[str, Any]): Outreach success indicators.
        """
        metrics = data.get("metrics", {})
        improved_skills = data.get("improved_skills", [])
        recruiter_prob = data.get("recruiter_prob", {})

        if not improved_skills:
            improved_skills = ["FastAPI", "Systems", "TypeScript"]

        # 1. Run sub-engines
        leverage_data = LeverageSummaryEngine.identify_leverage_points(metrics, improved_skills)
        recruiter_data = RecruiterPositioningEngine.evaluate_recruiter_positioning(metrics, recruiter_prob)
        market_data = MarketPositioningEngine.evaluate_market_positioning(improved_skills, metrics)

        # 2. Package into structured Opportunity Clusters
        clusters = []

        # Cluster A: Tech Stack Leverage
        tech_cluster = OpportunityClusterModel(
            cluster_name="Cloud-Native Realtime API Architecture",
            target_specialization=market_data["target_specialization"],
            compound_leverage_multiplier=leverage_data["compound_leverage_multiplier"],
            recruiter_pull_index=recruiter_data["recruiter_pull_index"],
            market_demand_index=market_data["market_demand_index"],
            leverage_roadmap_skills=[s for s in improved_skills if s.lower() in ["fastapi", "kubernetes", "typescript", "redis"]],
            synthesis_description=(
                f"{market_data['positioning_summary']} "
                f"{recruiter_data['description']} "
                f"Leverage milestones prioritized: {', '.join(leverage_data['leverage_milestones'])}."
            )
        )
        clusters.append(tech_cluster)

        # Cluster B (Secondary projection): Systems Infrastructure Acceleration
        systems_cluster = OpportunityClusterModel(
            cluster_name="Distributed Infrastructure & High-Performance Backends",
            target_specialization="Distributed Systems Infrastructure",
            compound_leverage_multiplier=round(leverage_data["compound_leverage_multiplier"] * 0.9, 2),
            recruiter_pull_index=round(recruiter_data["recruiter_pull_index"] * 0.95, 1),
            market_demand_index=round(min(100.0, market_data["market_demand_index"] * 0.92), 1),
            leverage_roadmap_skills=["Systems", "Kubernetes", "Redis"],
            synthesis_description=(
                "Secondary trajectory projection leveraging heavy infrastructure improvements. "
                "Calculated high-velocity alignment for systems-level development roles."
            )
        )
        clusters.append(systems_cluster)

        return {
            "opportunity_clusters": [c.model_dump() for c in clusters]
        }
