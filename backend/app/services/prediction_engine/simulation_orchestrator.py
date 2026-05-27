from typing import List, Dict, Any, Optional
from datetime import datetime

# Shared Imports
from app.services.prediction_engine.shared.simulation import PredictiveSandbox
from app.services.prediction_engine.shared.confidence import ConfidenceVector
from app.services.prediction_engine.predictive_memory import PredictiveMemoryLayer

# Trajectory Imports
from app.services.prediction_engine.trajectory.trajectory_simulator import TrajectorySimulator
from app.services.prediction_engine.trajectory.execution_projection import ExecutionProjector
from app.services.prediction_engine.trajectory.drift_detection import DriftDetectionEngine
from app.services.prediction_engine.trajectory.leverage_forecaster import LeverageForecaster

# Recruiter Imports
from app.services.prediction_engine.recruiter.recruiter_probability import RecruiterProbabilityModel
from app.services.prediction_engine.recruiter.engagement_forecast import RecruiterEngagementForecaster
from app.services.prediction_engine.recruiter.outreach_model import OutreachModel
from app.services.prediction_engine.recruiter.recruiter_drift import RecruiterDriftModel

# Market Imports
from app.services.prediction_engine.market.market_alignment import MarketAlignmentModel
from app.services.prediction_engine.market.skill_forecast import SkillRelevanceForecaster
from app.services.prediction_engine.market.demand_projection import DemandProjector
from app.services.prediction_engine.market.compensation_projection import CompensationProjector

# Strategy Imports
from app.services.prediction_engine.strategy.opportunity_windows import OpportunityWindowModel
from app.services.prediction_engine.strategy.execution_paths import ExecutionPathModel
from app.services.prediction_engine.strategy.roadmap_projection import RoadmapProjector
from app.services.prediction_engine.strategy.risk_model import RiskModel

# Optimization & Calibration Imports
from app.services.prediction_engine.adaptive_confidence import AdaptiveConfidenceEngine
from app.services.prediction_engine.strategic_optimizer import StrategicOptimizer

# Active State import
try:
    from app.services.memory_engine.drift_analyzer import drift_engine
except ImportError:
    drift_engine = None

class SimulationOrchestrator:
    """Combines all sub-model projections into an isolated simulation snapshot."""

    @staticmethod
    def run_simulation(
        name: str,
        improved_skills: List[str],
        shipped_projects: int,
        outreach_frequency: float,
        execution_consistency: float,
        save_to_history: bool = True
    ) -> Dict[str, Any]:
        # 1. Fetch current active metrics
        if drift_engine:
            try:
                current_metrics = drift_engine._get_current_metrics()
            except Exception:
                current_metrics = {
                    "matchScore": 94.0,
                    "careerVelocity": 78.0,
                    "marketFit": 91.0,
                    "recruiterConfidence": 87.0
                }
        else:
            current_metrics = {
                "matchScore": 94.0,
                "careerVelocity": 78.0,
                "marketFit": 91.0,
                "recruiterConfidence": 87.0
            }

        # 2. Replicate state inside sandbox (isolation)
        sandbox_state = PredictiveSandbox.replicate_state(current_metrics)

        # 3. Simulate Trajectory metrics and reasoning chain
        trajectory_results = TrajectorySimulator.simulate_path(
            current_metrics=sandbox_state,
            improved_skills=improved_skills,
            shipped_projects=shipped_projects,
            outreach_frequency=outreach_frequency,
            execution_consistency=execution_consistency
        )

        simulated_metrics = trajectory_results["metrics"]

        # 4. Projections over time
        weeks_limit = 12
        projected_velocity = ExecutionProjector.project_velocity(
            base_velocity=simulated_metrics["careerVelocity"],
            consistency=execution_consistency,
            weeks=weeks_limit
        )

        leverage_curve = ExecutionProjector.project_leverage_curve(
            base_leverage=simulated_metrics["marketFit"],
            projects=shipped_projects,
            weeks=weeks_limit
        )

        # 5. Drift and warning analysis
        # If execution consistency is low, simulate consecutive stagnant days
        simulated_stagnant_days = int((1.0 - execution_consistency) * 28)
        drift_signals = DriftDetectionEngine.analyze_drift(
            metrics=simulated_metrics,
            consecutive_stagnant_days=simulated_stagnant_days
        )

        # 6. Recruiter Forecasts
        recruiter_prob = RecruiterProbabilityModel.calculate_probability(
            metrics=simulated_metrics,
            outreach_frequency=outreach_frequency
        )

        weekly_engagement = RecruiterEngagementForecaster.forecast_engagement(
            metrics=simulated_metrics,
            weeks=weeks_limit
        )

        # Simulated cold outreach funnel with 30 target companies
        outreach_funnel = OutreachModel.simulate_funnel(
            contacts=30,
            response_rate=recruiter_prob["success_probability"]
        )

        # Visibility decay projection (simulating future drift if user stops outreach)
        visibility_decay = RecruiterDriftModel.project_visibility_decay(
            base_visibility=simulated_metrics["recruiterConfidence"],
            weeks_inactive=weeks_limit
        )

        # 7. Market Alignment
        market_alignment = MarketAlignmentModel.evaluate_alignment(
            skills=improved_skills,
            metrics=simulated_metrics
        )

        skill_relevance_12m = SkillRelevanceForecaster.forecast_skills()

        demand_volume_12m = DemandProjector.project_volume(
            base_volume=120,
            growth_rate=0.025,
            months=12
        )

        compensation_proj = CompensationProjector.project_salary(
            skills=improved_skills,
            base_salary=115000.0
        )

        # 8. Strategy & Opportunities
        opportunity_windows = OpportunityWindowModel.identify_windows(
            skills=improved_skills
        )

        # Dynamic target role detection
        target_role = "Platform Systems Architect" if any(s.lower() in ["fastapi", "kubernetes", "redis", "docker"] for s in improved_skills) else "Fullstack UI Engineer"
        execution_path = ExecutionPathModel.calculate_path(target_role=target_role)

        raw_roadmap_nodes = RoadmapProjector.project_nodes(skills=improved_skills)
        roadmap_nodes = StrategicOptimizer.optimize_execution_sequence(
            skills=improved_skills,
            roadmap_nodes=raw_roadmap_nodes,
            opportunity_windows=opportunity_windows
        )

        risk_factors = RiskModel.calculate_risk(
            metrics=simulated_metrics,
            execution_consistency=execution_consistency
        )

        leverage_pivots = LeverageForecaster.forecast_leverage_pivots(
            skills=improved_skills,
            metrics=simulated_metrics
        )

        # 9. Evaluate Confidence Vector and calibrate using memory layer
        adaptive_conf = AdaptiveConfidenceEngine.evaluate_adaptive_confidence(
            metrics=simulated_metrics,
            outreach_count=int(outreach_frequency * 10),
            history_len=len(improved_skills) + shipped_projects
        )

        # Calibrate from historical memory
        calibration = PredictiveMemoryLayer.calibrate_scores(current_metrics)
        calibrated_confidence = adaptive_conf["calibrated_confidence"]

        # 10. Assemble complete unified snapshot
        results = {
            "initial_metrics": current_metrics,
            "simulated_metrics": simulated_metrics,
            "trajectory_summary": {
                "probability_score": trajectory_results["probability_score"],
                "leverage_gain": trajectory_results["leverage_gain"],
                "market_alignment_shift": trajectory_results["market_alignment_shift"],
                "recruiter_visibility_delta": trajectory_results["recruiter_visibility_delta"],
                "estimated_execution_cost": trajectory_results["estimated_execution_cost"],
                "strategic_risk_score": trajectory_results["strategic_risk_score"],
                "reasoning_chain": trajectory_results["reasoning_chain"]
            },
            "projections": {
                "weeks": weeks_limit,
                "projected_velocity": [round(v, 1) for v in projected_velocity],
                "leverage_curve": leverage_curve,
                "visibility_decay": [round(v, 1) for v in visibility_decay]
            },
            "recruiter_forecast": {
                "success_probability": recruiter_prob["success_probability"],
                "rejection_risk": recruiter_prob["rejection_risk"],
                "expected_responses": recruiter_prob["expected_responses_per_10_contacts"],
                "weekly_engagement": weekly_engagement,
                "outreach_funnel": outreach_funnel
            },
            "market_alignment": {
                "alignment_score": market_alignment["market_alignment_score"],
                "matched_trending_skills": market_alignment["matched_trending_skills"],
                "gap_count": market_alignment["gap_count"],
                "skill_relevance_12m": skill_relevance_12m,
                "demand_volume_12m": demand_volume_12m,
                "compensation": compensation_proj
            },
            "strategy": {
                "opportunity_windows": opportunity_windows,
                "execution_path": execution_path,
                "roadmap_nodes": roadmap_nodes,
                "risk_factors": risk_factors,
                "leverage_pivots": leverage_pivots
            },
            "drift_signals": drift_signals,
            "confidence_vector": {
                "prediction_confidence": adaptive_conf["prediction_confidence"],
                "data_density_score": adaptive_conf["data_density_score"],
                "market_signal_strength": adaptive_conf["market_signal_strength"],
                "recruiter_signal_strength": adaptive_conf["recruiter_signal_strength"],
                "execution_reliability_score": adaptive_conf["execution_reliability_score"],
                "calibrated_confidence": calibrated_confidence,
                "historical_accuracy_calibration": calibration["historical_accuracy"]
            }
        }

        # 11. Optionally persist to history
        if save_to_history:
            parameters = {
                "improved_skills": improved_skills,
                "shipped_projects": shipped_projects,
                "outreach_frequency": outreach_frequency,
                "execution_consistency": execution_consistency
            }
            saved_snap = PredictiveMemoryLayer.save_snapshot(name, parameters, results)
            results["snapshot_id"] = saved_snap["id"]

        return results
