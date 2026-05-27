from typing import Dict, Any
from app.services.synthesis.shared.synthesis_protocols import SynthesisProvider
from app.services.synthesis.shared.synthesis_models import RiskBriefingModel
from app.services.synthesis.risk.stagnation_summary import StagnationSummaryEngine
from app.services.synthesis.risk.opportunity_fragility import OpportunityFragilityEngine
from app.services.synthesis.risk.trajectory_decay import TrajectoryDecayEngine

class StrategicRiskSynthesizer(SynthesisProvider):
    """Orchestrates stagnation, fragility, and decay sub-engines into a centralized Strategic Risk Briefing."""

    def synthesize(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Synthesizes the overall strategic risk of the trajectory.
        
        Args:
            data (Dict[str, Any]): Predictor payload containing:
                - metrics (Dict[str, float]): Trajectory metrics.
                - execution_consistency (float): Execution consistency rate (0.0 to 1.0).
                - consecutive_stagnant_days (int): Days since last update/shipping.
                - closing_days (int): Days remaining in high-priority window.
                - unresponsive_leads (int): Unresponsive recruiter leads count.
                - weeks_inactive (int): Outreach dormancy weeks.
        """
        metrics = data.get("metrics", {})
        execution_consistency = data.get("execution_consistency", 0.85)
        consecutive_stagnant_days = data.get("consecutive_stagnant_days", 2)
        closing_days = data.get("closing_days", 12)
        unresponsive_leads = data.get("unresponsive_leads", 1)
        weeks_inactive = data.get("weeks_inactive", 1)

        # 1. Run sub-engines
        stagnation = StagnationSummaryEngine.calculate_stagnation(
            metrics, execution_consistency, consecutive_stagnant_days
        )
        fragility = OpportunityFragilityEngine.evaluate_fragility(
            closing_days, unresponsive_leads
        )
        decay = TrajectoryDecayEngine.calculate_decay(
            metrics, weeks_inactive
        )

        # 2. Consolidate risk factors
        all_triggers = sorted(list(set(
            stagnation["stagnant_triggers"] + fragility["triggers"] + decay["triggers"]
        )))
        
        if not all_triggers:
            all_triggers = ["Outreach pacing alert"]

        all_actions = sorted(list(set(
            fragility["reconstruction_actions"] + decay["reconstruction_actions"]
        )))
        
        if not all_actions:
            all_actions = ["Maintain high-frequency consistent shipping patterns"]

        # Aggregate risk levels into standard Pydantic outputs
        max_coeff = max(stagnation["stagnation_coefficient"], fragility["fragility_score"], decay["decay_rate"])
        
        if max_coeff >= 0.7:
            overall_level = "CRITICAL"
        elif max_coeff >= 0.5:
            overall_level = "HIGH"
        elif max_coeff >= 0.3:
            overall_level = "MEDIUM"
        else:
            overall_level = "LOW"

        briefing = RiskBriefingModel(
            stagnation_coefficient=max_coeff,
            risk_factor_level=overall_level,
            diagnostics_brief=(
                f"{stagnation['diagnostics_brief']} "
                f"Trajectory decay risk is estimated at {int(decay['decay_rate']*100)}% "
                f"while opportunity fragility score is {int(fragility['fragility_score']*100)}%."
            ),
            active_risk_triggers=all_triggers,
            reconstruction_actions=all_actions
        )

        return briefing.model_dump()
