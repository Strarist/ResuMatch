from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from datetime import datetime

from app.core.dependencies import get_current_user
from app.models.user import User

# Explainability submodules imports
from app.services.explainability.reasoning.reasoning_engine import ReasoningEngine
from app.services.explainability.confidence.confidence_explainer import ConfidenceExplainer
from app.services.explainability.confidence.calibration_trace import CalibrationTrace
from app.services.explainability.confidence.weighting_breakdown import WeightingBreakdown
from app.services.explainability.prediction.forecast_lineage import PredictionLineageGraph
from app.services.explainability.prediction.projection_trace import ProjectionTrace
from app.services.explainability.prediction.drift_reasoning import DriftReasoning
from app.services.explainability.optimization.optimization_trace import OptimizationTrace
from app.services.explainability.optimization.leverage_reasoning import LeverageReasoning
from app.services.explainability.optimization.strategic_priority_trace import StrategicPriorityTrace

# Helper imports from prediction engine
from app.services.prediction_engine.predictive_memory import PredictiveMemoryLayer
from app.services.prediction_engine.trajectory.drift_detection import DriftDetectionEngine
from app.services.prediction_engine.strategy.opportunity_windows import OpportunityWindowModel
from app.services.prediction_engine.market.skill_forecast import SkillRelevanceForecaster
from app.services.prediction_engine.strategy.roadmap_projection import RoadmapProjector

router = APIRouter(prefix="/v1/intelligence/explainability", tags=["Explainable Intelligence"])

def _get_active_simulation_state() -> Dict[str, Any]:
    """Helper to extract parameters and results from the latest simulation snapshot or fallbacks."""
    snapshots = PredictiveMemoryLayer.get_snapshots()

    # Defaults/Fallbacks if history is empty
    improved_skills = ["FastAPI", "Kubernetes"]
    outreach_frequency = 0.8
    execution_consistency = 0.85
    shipped_projects = 2

    metrics = {
        "matchScore": 94.0,
        "careerVelocity": 78.0,
        "marketFit": 91.0,
        "recruiterConfidence": 87.0
    }

    opportunity_windows = [
        {"role_category": "Systems Platform Engineer", "days_remaining": 12, "status": "CLOSING", "leverage_requirement": "Kubernetes, FastAPI"},
        {"role_category": "Backend AI Developer", "days_remaining": 25, "status": "OPEN", "leverage_requirement": "Python, FastAPI"}
    ]

    # Generate default roadmap nodes
    raw_roadmap_nodes = [
        {"node_title": "FastAPI Systems Design", "phase": "Phase 1", "difficulty": "Medium", "estimated_weeks": 2},
        {"node_title": "Kubernetes Orchestration", "phase": "Phase 2", "difficulty": "High", "estimated_weeks": 4},
        {"node_title": "Docker Containerization", "phase": "Phase 1", "difficulty": "Low", "estimated_weeks": 1},
        {"node_title": "Redis Cache Integration", "phase": "Phase 3", "difficulty": "Medium", "estimated_weeks": 2}
    ]

    market_relevance = [
        {"skill": "fastapi", "trend": "UP", "current_relevance": 85, "projected_relevance_12m": 95},
        {"skill": "kubernetes", "trend": "UP", "current_relevance": 90, "projected_relevance_12m": 98},
        {"skill": "docker", "trend": "STABLE", "current_relevance": 88, "projected_relevance_12m": 88},
        {"skill": "redis", "trend": "UP", "current_relevance": 80, "projected_relevance_12m": 85}
    ]

    projections = {
        "weeks": 12,
        "projected_velocity": [78.0 + (i * 1.5) for i in range(12)],
        "leverage_curve": [{"week": i+1, "leverage": 91.0 + (i * 0.5), "leverage_gain": f"+{round(i * 0.5, 1)}%"} for i in range(12)],
        "visibility_decay": [87.0 - (i * 1.2) for i in range(12)]
    }

    if snapshots:
        latest = snapshots[0]
        params = latest.get("parameters", {})
        results = latest.get("results", {})

        improved_skills = params.get("improved_skills", improved_skills)
        outreach_frequency = params.get("outreach_frequency", outreach_frequency)
        execution_consistency = params.get("execution_consistency", execution_consistency)
        shipped_projects = params.get("shipped_projects", shipped_projects)

        metrics = results.get("simulated_metrics", metrics)
        projections = results.get("projections", projections)

        strategy = results.get("strategy", {})
        opportunity_windows = strategy.get("opportunity_windows", opportunity_windows)
        raw_roadmap_nodes = RoadmapProjector.project_nodes(skills=improved_skills)

        market_alignment = results.get("market_alignment", {})
        market_relevance = market_alignment.get("skill_relevance_12m", market_relevance)

    # Re-run or get optimized nodes from actual strategy model
    from app.services.prediction_engine.strategic_optimizer import StrategicOptimizer
    optimized_nodes = StrategicOptimizer.optimize_execution_sequence(
        skills=improved_skills,
        roadmap_nodes=raw_roadmap_nodes,
        opportunity_windows=opportunity_windows
    )

    return {
        "improved_skills": improved_skills,
        "outreach_frequency": outreach_frequency,
        "execution_consistency": execution_consistency,
        "shipped_projects": shipped_projects,
        "metrics": metrics,
        "opportunity_windows": opportunity_windows,
        "raw_roadmap_nodes": raw_roadmap_nodes,
        "optimized_nodes": optimized_nodes,
        "market_relevance": market_relevance,
        "projections": projections
    }

@router.get("/reasoning", response_model=Dict[str, Any])
async def get_general_reasoning(
    current_user: User = Depends(get_current_user)
):
    """Compiles the general decision paths, causal explainer logs, and active influence chains."""
    try:
        state = _get_active_simulation_state()

        matrix = ReasoningEngine.compile_strategic_explanations(
            skills=state["improved_skills"],
            metrics=state["metrics"],
            outreach_frequency=state["outreach_frequency"],
            execution_consistency=state["execution_consistency"],
            roadmap_nodes=state["optimized_nodes"],
            opportunity_windows=state["opportunity_windows"],
            market_relevance=state["market_relevance"]
        )

        matrix["reasoning_compiled_at"] = datetime.utcnow().isoformat() + "Z"

        # Add projection traces week by week to reasoning response as well
        matrix["projection_timeline"] = ProjectionTrace.get_projection_trace(state["projections"])

        return matrix
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile reasoning matrix: {str(e)}"
        )

@router.get("/lineage", response_model=Dict[str, Any])
async def get_prediction_lineage(
    current_user: User = Depends(get_current_user)
):
    """Retrieves the prediction lineage causal graph structure."""
    try:
        return PredictionLineageGraph.get_lineage_graph()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate prediction lineage graph: {str(e)}"
        )

@router.get("/confidence", response_model=Dict[str, Any])
async def get_confidence_breakdown(
    current_user: User = Depends(get_current_user)
):
    """Retrieves dynamic reliability weighting statistics and historical calibration logs."""
    try:
        state = _get_active_simulation_state()

        # Build confidence vector matching input schema
        # We need data density, market signal, recruiter signal, execution reliability, calibrated confidence
        snapshots = PredictiveMemoryLayer.get_snapshots()
        calibration = PredictiveMemoryLayer.calibrate_scores(state["metrics"])

        confidence_vector = {
            "data_density_score": min(1.0, (len(state["metrics"]) * 0.15) + (len(snapshots) * 0.1) + 0.3),
            "market_signal_strength": state["metrics"].get("marketFit", 91.0) / 100.0,
            "recruiter_signal_strength": min(1.0, (state["outreach_frequency"] * 0.5) + 0.4),
            "execution_reliability_score": state["execution_consistency"],
            "calibrated_confidence": calibration.get("confidence_multiplier", 1.0) * 0.8
        }

        explanation = ConfidenceExplainer.explain_confidence(confidence_vector)
        calibration_history = CalibrationTrace.get_trace_history()
        weights = WeightingBreakdown.get_active_weights()

        return {
            "confidence_explanation": explanation,
            "calibration_history": calibration_history,
            "weighting_breakdown": weights,
            "confidence_vector": confidence_vector
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate confidence breakdown: {str(e)}"
        )

@router.get("/optimization", response_model=Dict[str, Any])
async def get_optimization_details(
    current_user: User = Depends(get_current_user)
):
    """Retrieves priority sequencing shifts, compound scoring equations, and opportunity traces."""
    try:
        state = _get_active_simulation_state()

        optimization_trace = OptimizationTrace.generate_optimization_trace(
            raw_nodes=state["raw_roadmap_nodes"],
            optimized_nodes=state["optimized_nodes"]
        )

        priority_trace = StrategicPriorityTrace.trace_priorities(state["optimized_nodes"])

        # Build a leverage explanation for all optimized nodes
        leverage_explanations = []
        for node in state["optimized_nodes"]:
            # Find matching urgency factor
            urgency_factor = 1.0
            for win in state["opportunity_windows"]:
                role = win.get("role_category", "").lower()
                title = node.get("node_title", "").lower()
                if any(kw in role or kw in title for kw in ["systems", "platform", "backend", "fastapi"]):
                    days = win.get("days_remaining", 30)
                    status = win.get("status", "OPEN")
                    multiplier = 2.0 if status == "CLOSING" else (1.5 if status == "OPEN" else 1.1)
                    urgency_factor = max(urgency_factor, (10.0 / max(1.0, float(days))) * multiplier)

            explanation = LeverageReasoning.explain_leverage(
                node_title=node.get("node_title"),
                difficulty=node.get("difficulty", "Medium"),
                estimated_weeks=node.get("estimated_weeks", 2),
                urgency_factor=urgency_factor
            )
            leverage_explanations.append(explanation)

        return {
            "optimization_trace": optimization_trace,
            "priority_trace": priority_trace,
            "leverage_explanations": leverage_explanations
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile optimization details: {str(e)}"
        )

@router.get("/drift", response_model=Dict[str, Any])
async def get_drift_diagnostics(
    current_user: User = Depends(get_current_user)
):
    """Retrieves real-time trajectory drift alerts and mitigation plans mapped to stagnation risks."""
    try:
        state = _get_active_simulation_state()

        consecutive_stagnant_days = int((1.0 - state["execution_consistency"]) * 28)
        drift_signals = DriftDetectionEngine.analyze_drift(
            metrics=state["metrics"],
            consecutive_stagnant_days=consecutive_stagnant_days
        )

        explanation = DriftReasoning.explain_drift(
            drift_signals=drift_signals,
            execution_consistency=state["execution_consistency"],
            outreach_frequency=state["outreach_frequency"],
            market_fit=state["metrics"].get("marketFit", 91.0)
        )

        return {
            "raw_drift_signals": drift_signals,
            "drift_diagnostics": explanation
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate drift diagnostics: {str(e)}"
        )
