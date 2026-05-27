from typing import List, Dict, Any
from app.services.synthesis.shared.synthesis_models import ExecutionStorylinePoint

class ExecutionStorylineEngine:
    """Constructs chronological execution evolution storylines and milestones."""

    @staticmethod
    def build_storyline(
        metrics: Dict[str, float],
        improved_skills: List[str]
    ) -> List[ExecutionStorylinePoint]:
        """
        Builds a chronological storyline from week 1 through 4 projecting execution milestones.
        
        Args:
            metrics (Dict[str, float]): Core trajectory metrics.
            improved_skills (List[str]): List of newly acquired or targeted skills.
        """
        recruiter_confidence = metrics.get("recruiterConfidence", 80.0)
        market_fit = metrics.get("marketFit", 80.0)

        storyline = [
            ExecutionStorylinePoint(
                week=1,
                milestone_title="Foundation Synthesis & Keyword Calibration",
                narrative_evolution="Unified raw experience logs and aligned primary profile keywords to systems infrastructure roles.",
                recruiter_visibility_score=round(recruiter_confidence * 0.9, 1),
                leverage_accumulated=1.0,
                consistency_rate=0.85
            ),
            ExecutionStorylinePoint(
                week=2,
                milestone_title="Realtime Stream & SSE Optimization",
                narrative_evolution="Introduced low-latency telemetry processing and stabilized SSE event handlers across endpoints.",
                recruiter_visibility_score=round(recruiter_confidence * 0.95, 1),
                leverage_accumulated=2.5,
                consistency_rate=0.90
            ),
            ExecutionStorylinePoint(
                week=3,
                milestone_title="Causal Graph & Calibration Hardening",
                narrative_evolution="Constructed structured calibration loops for sandbox memory snapshots, reducing predictive variance.",
                recruiter_visibility_score=round(recruiter_confidence * 1.0, 1),
                leverage_accumulated=4.2,
                consistency_rate=0.95
            ),
            ExecutionStorylinePoint(
                week=4,
                milestone_title="Explainable Intelligence Release",
                narrative_evolution="Stabilized the Executive strategy dashboard and synthesized deterministic narratives for recruiter pull.",
                recruiter_visibility_score=round(min(100.0, recruiter_confidence * 1.05), 1),
                leverage_accumulated=6.0,
                consistency_rate=0.95
            )
        ]

        return storyline
