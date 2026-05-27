from typing import Dict, Any

class TrajectoryNarrativeEngine:
    """Models trajectory directions, pressure trends, and structural/strategic weaknesses."""

    @staticmethod
    def evaluate_trajectory(
        metrics: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Synthesizes trajectory drift indicators and potential strategic risk factors.
        
        Args:
            metrics (Dict[str, float]): Trajectory metrics.
        """
        career_velocity = metrics.get("careerVelocity", 80.0)
        recruiter_confidence = metrics.get("recruiterConfidence", 80.0)

        # Execution trajectory assessment
        if career_velocity >= 85.0:
            exec_traj = "Exponential Growth: Velocity is optimized with high-performance shipping cadence."
        elif career_velocity >= 70.0:
            exec_traj = "Linear Stabilization: Maintaining a reliable, steady pace of incremental upgrades."
        else:
            exec_traj = "Decelerating Phase: Active intervention recommended to re-engage momentum cycles."

        # Strategic weakness pinpointing
        weaknesses = []
        if recruiter_confidence < 80.0:
            weaknesses.append("Moderate profile visibility with target systems engineering recruiters")
        if career_velocity < 80.0:
            weaknesses.append("Extended period between high-impact production releases")
        
        if not weaknesses:
            weaknesses.append("Potential compression-loss of deep technical skill attributes in high-level summaries")

        return {
            "execution_trajectory": exec_traj,
            "strategic_weaknesses": " and ".join(weaknesses) + "."
        }
