from typing import Dict, Any, List
from app.services.synthesis.shared.synthesis_protocols import SynthesisProvider
from app.services.synthesis.shared.synthesis_models import CompressedSignal
from app.services.synthesis.compression.telemetry_collapse import TelemetryCollapser
from app.services.synthesis.compression.influence_prioritizer import InfluencePrioritizer
from app.services.synthesis.compression.orchestration_distiller import OrchestrationDistiller

class SignalCompressor(SynthesisProvider):
    """Orchestrates high-frequency telemetry collapse, influence prioritization, and roadmap distillation."""

    def synthesize(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Synthesizes raw simulation and trajectory data into compressed high-impact signals.
        
        Args:
            data (Dict[str, Any]): Predictor or simulation snapshot payload containing:
                - metrics (Dict[str, float]): Current or projected metrics.
                - metric_history (List[Dict[str, Any]]): Historical telemetry lists.
                - influence_chain (Dict[str, Any]): Causal factor importances.
                - optimization_trace (List[Dict[str, Any]]): Prioritization changes.
                - confidence_vector (Dict[str, float]): Dynamic confidence levels.
        """
        metrics = data.get("metrics", {})
        metric_history = data.get("metric_history", [])
        influence_chain = data.get("influence_chain", {})
        optimization_trace = data.get("optimization_trace", [])
        confidence_vector = data.get("confidence_vector", {})

        signals = []

        # 1. Trajectory Momentum Signal (via Telemetry Collapser)
        history_values = []
        for h in metric_history:
            if "matchScore" in h:
                history_values.append(h["matchScore"])
        if not history_values and metrics.get("matchScore") is not None:
            history_values = [metrics["matchScore"] * 0.9, metrics["matchScore"] * 0.95, metrics["matchScore"]]

        collapsed_momentum = TelemetryCollapser.collapse_metric_trajectory(history_values)
        momentum_confidence = confidence_vector.get("trajectory", 0.85)
        
        signals.append(CompressedSignal(
            signal_type="TRAJECTORY_MOMENTUM",
            strategic_importance=0.8,
            urgency="MEDIUM",
            leverage_impact=collapsed_momentum / 100.0,
            confidence=momentum_confidence,
            synthesis_summary=f"Trajectory baseline collapsed to {collapsed_momentum}% moving average over telemetry window."
        ))

        # 2. Causal Influence Signal (via Influence Prioritizer)
        top_influences = InfluencePrioritizer.extract_top_influences(influence_chain, limit=2)
        influence_confidence = confidence_vector.get("causal", 0.9)
        
        if top_influences:
            lead_factor = top_influences[0]
            signals.append(CompressedSignal(
                signal_type="INFLUENCE_FACTOR",
                strategic_importance=lead_factor["importance_weight"],
                urgency="HIGH" if lead_factor["importance_weight"] > 0.7 else "MEDIUM",
                leverage_impact=1.2 if lead_factor["impact_direction"] == "POSITIVE" else 0.8,
                confidence=influence_confidence,
                synthesis_summary=f"Dominant predictive impact from factor '{lead_factor['factor_name']}' ({lead_factor['impact_direction']})."
            ))

        # 3. Roadmap Distillation Signal (via Orchestration Distiller)
        if not optimization_trace:
            # Fallback/default if empty
            optimization_trace = [
                {"node_title": "Implement Distributed SSE", "position_shift": "UP"},
                {"node_title": "Refactor Memory Caching", "position_shift": "NEW"}
            ]
        distillation = OrchestrationDistiller.distill_priority_shifts(optimization_trace)
        roadmap_confidence = confidence_vector.get("optimization", 0.8)
        
        promoted = ", ".join(distillation["key_promotions"]) if distillation["key_promotions"] else "none"
        signals.append(CompressedSignal(
            signal_type="ROADMAP_SHIFT",
            strategic_importance=min(1.0, 0.4 + (distillation["total_mutations"] * 0.15)),
            urgency="HIGH" if distillation["total_mutations"] > 2 else "LOW",
            leverage_impact=1.0 + (distillation["total_mutations"] * 0.05),
            confidence=roadmap_confidence,
            synthesis_summary=f"Roadmap distiller detected {distillation['total_mutations']} mutations. Promoted nodes: {promoted}."
        ))

        return {
            "signals": [s.model_dump() for s in signals]
        }
