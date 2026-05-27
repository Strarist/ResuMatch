from typing import Dict, Any, List
from app.services.explainability.reasoning.influence_chain import InfluenceChain
from app.services.explainability.reasoning.causal_explainer import CausalExplainer
from app.services.explainability.reasoning.decision_trace import DecisionTrace

class ReasoningEngine:
    """Coordinates reasoning sub-modules to generate transparent explanation models."""

    @classmethod
    def compile_strategic_explanations(
        cls,
        skills: List[str],
        metrics: Dict[str, float],
        outreach_frequency: float,
        execution_consistency: float,
        roadmap_nodes: List[Dict[str, Any]],
        opportunity_windows: List[Dict[str, Any]],
        market_relevance: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Runs all reasoning sub-modules to compile a comprehensive explainability matrix."""

        # 1. Influence Chain
        influence = InfluenceChain.generate_chain(
            skills=skills,
            metrics=metrics,
            outreach_frequency=outreach_frequency,
            execution_consistency=execution_consistency
        )

        # 2. Causal Explanations for all prioritized nodes
        causal_explanations = []
        for node in roadmap_nodes[:2]: # Explain top 2 prioritized skills
            node_title = node.get("node_title", "")
            explanation = CausalExplainer.explain_priority(
                node_title=node_title,
                opportunity_windows=opportunity_windows,
                market_relevance=market_relevance
            )
            causal_explanations.append(explanation)

        # 3. Decision traces
        parameters = {
            "improved_skills": skills,
            "outreach_frequency": outreach_frequency,
            "execution_consistency": execution_consistency
        }
        results = {
            "confidence_vector": {
                "calibrated_confidence": 0.8 # Placeholder or default
            }
        }
        traces = DecisionTrace.generate_traces(parameters, results)

        return {
            "influence_chain": influence,
            "causal_explanations": causal_explanations,
            "decision_traces": traces,
            "reasoning_compiled_at": None # To be populated by endpoint
        }
