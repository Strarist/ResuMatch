from typing import Dict, Any, List
from app.services.synthesis.shared.synthesis_protocols import SynthesisProvider
from app.services.synthesis.shared.synthesis_models import NarrativeBriefModel
from app.services.synthesis.narrative.strategic_summary import StrategicSummaryEngine
from app.services.synthesis.narrative.execution_storyline import ExecutionStorylineEngine
from app.services.synthesis.narrative.trajectory_narrative import TrajectoryNarrativeEngine
from app.services.synthesis.narrative.strategic_positioning import StrategicPositioningEngine

class NarrativeEngine(SynthesisProvider):
    """Orchestrates strategic summaries, execution storylines, and trajectory narratives into a unified Executive Narrative."""

    def synthesize(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Synthesizes strategic and positioning narratives based on raw trajectory projections.
        
        Args:
            data (Dict[str, Any]): Predictor payload containing:
                - metrics (Dict[str, float]): Core trajectory metrics.
                - improved_skills (List[str]): List of newly acquired or targeted skills.
        """
        metrics = data.get("metrics", {})
        improved_skills = data.get("improved_skills", [])

        # 1. Run sub-engines
        summary = StrategicSummaryEngine.compile_strategic_summary(metrics)
        storyline = ExecutionStorylineEngine.build_storyline(metrics, improved_skills)
        trajectory = TrajectoryNarrativeEngine.evaluate_trajectory(metrics)
        positioning = StrategicPositioningEngine.evaluate_positioning(metrics, improved_skills)

        # 2. Package into NarrativeBriefModel
        brief = NarrativeBriefModel(
            current_positioning=summary["current_positioning"],
            strongest_leverage_direction=summary["strongest_leverage_direction"],
            execution_trajectory=trajectory["execution_trajectory"],
            opportunity_pressure=positioning["opportunity_pressure"],
            market_alignment=positioning["market_alignment"],
            recruiter_positioning=positioning["recruiter_positioning"],
            strategic_weaknesses=trajectory["strategic_weaknesses"]
        )

        return {
            "narrative_brief": brief.model_dump(),
            "execution_storyline": [p.model_dump() for p in storyline]
        }
