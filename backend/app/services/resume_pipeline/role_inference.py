import logging
from typing import List, Dict, Any
from app.services.trajectory.engine import compute_trajectory

logger = logging.getLogger(__name__)

def infer_strategic_role(skills: List[str]) -> Dict[str, Any]:
    """Analyze normalized skills to infer primary target role, secondary paths, and readiness metrics."""
    # Build standard inputs for trajectory engine
    skill_confidences = {s: 0.85 for s in skills}

    trajectory = compute_trajectory(
        user_skills=skills,
        skill_confidences=skill_confidences,
        completed_nodes=[],
        deferred_nodes=[],
        growth_velocity=0.0
    )

    logger.info(f"Inferred dominant trajectory: {trajectory['dominant_path']} with readiness competitiveness: {trajectory['competitiveness_score']}")
    return trajectory
