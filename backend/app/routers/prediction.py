"""REST router for predictive career simulations and trajectory forecasting."""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.services.prediction_engine import (
    SimulationOrchestrator,
    PredictiveMemoryLayer,
    PredictiveCalibrationEngine,
    TrajectoryLearningLayer
)
from app.services.prediction_engine.simulation_runtime_boundary import SimulationRuntimeBoundary

router = APIRouter(prefix="/v1/prediction", tags=["Predictive Intelligence"])


# === Request & Response Schemas ===

class SimulationRequest(BaseModel):
    name: Optional[str] = Field(None, description="Friendly name for the scenario snapshot")
    improved_skills: List[str] = Field(default_factory=list, description="List of target skills to simulate acquiring")
    shipped_projects: int = Field(0, ge=0, le=10, description="Number of engineering projects to simulate shipping")
    outreach_frequency: float = Field(0.5, ge=0.0, le=1.0, description="Outreach rhythm level from 0.0 (none) to 1.0 (intensive)")
    execution_consistency: float = Field(0.8, ge=0.0, le=1.0, description="Consistent learning/work execution rate")
    save_to_history: bool = Field(True, description="Whether to store the resulting snapshot in history")


class CalibrationRequest(BaseModel):
    snapshot_id: str = Field(..., description="ID of the simulation snapshot to compare")
    actual_outcome: Dict[str, float] = Field(
        ...,
        description="Dict containing actual outcome metrics: matchScore, careerVelocity, marketFit, recruiterConfidence"
    )


# === Endpoints ===

@router.post("/simulate", response_model=Dict[str, Any])
async def run_scenario_simulation(
    payload: SimulationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Runs a career trajectory simulation snapshot inside an isolated sandbox."""
    try:
        async with SimulationRuntimeBoundary.guard(db):
            results = SimulationOrchestrator.run_simulation(
                name=payload.name,
                improved_skills=payload.improved_skills,
                shipped_projects=payload.shipped_projects,
                outreach_frequency=payload.outreach_frequency,
                execution_consistency=payload.execution_consistency,
                save_to_history=payload.save_to_history
            )
            return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Predictive simulation execution failed: {str(e)}"
        )


@router.get("/history", response_model=List[Dict[str, Any]])
async def get_simulation_history(
    current_user: User = Depends(get_current_user)
):
    """Retrieves all saved historical simulation snapshots."""
    return PredictiveMemoryLayer.get_snapshots()


@router.get("/snapshot/{snapshot_id}", response_model=Dict[str, Any])
async def get_simulation_snapshot(
    snapshot_id: str,
    current_user: User = Depends(get_current_user)
):
    """Retrieves a single historical simulation snapshot by ID."""
    snapshot = PredictiveMemoryLayer.get_snapshot(snapshot_id)
    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation snapshot '{snapshot_id}' not found."
        )
    return snapshot


@router.delete("/snapshot/{snapshot_id}")
async def delete_simulation_snapshot(
    snapshot_id: str,
    current_user: User = Depends(get_current_user)
):
    """Deletes a historical simulation snapshot."""
    success = PredictiveMemoryLayer.delete_snapshot(snapshot_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation snapshot '{snapshot_id}' not found."
        )
    return {"message": f"Snapshot '{snapshot_id}' deleted successfully."}


@router.post("/calibrate", response_model=Dict[str, Any])
async def calibrate_prediction_scores(
    payload: CalibrationRequest,
    current_user: User = Depends(get_current_user)
):
    """Calibrates prediction heuristics by comparing actual outcomes to a past snapshot."""
    calibrated_snapshot = PredictiveMemoryLayer.track_forecast_success(
        snapshot_id=payload.snapshot_id,
        actual_outcome=payload.actual_outcome
    )
    if not calibrated_snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation snapshot '{payload.snapshot_id}' not found."
        )

    # Record learned pattern in Trajectory Learning Layer
    TrajectoryLearningLayer.record_learning_node(
        snapshot_id=payload.snapshot_id,
        parameters=calibrated_snapshot.get("parameters", {}),
        actual_growth=payload.actual_outcome
    )

    # Calculate fresh calibration factors
    calibration_factors = PredictiveMemoryLayer.calibrate_scores(payload.actual_outcome)
    return {
        "calibrated_snapshot": calibrated_snapshot,
        "calibration_factors": calibration_factors
    }


@router.get("/drift", response_model=List[Dict[str, Any]])
async def get_active_drift_warnings(
    current_user: User = Depends(get_current_user)
):
    """Analyzes active profile metrics to produce real-time trajectory drift signals."""
    from app.services.prediction_engine.trajectory.drift_detection import DriftDetectionEngine
    from app.services.memory_engine.drift_analyzer import drift_engine

    if drift_engine:
        metrics = drift_engine._get_current_metrics()
    else:
        metrics = {
            "matchScore": 94.0,
            "careerVelocity": 78.0,
            "marketFit": 91.0,
            "recruiterConfidence": 87.0
        }

    # Return drift signals
    return DriftDetectionEngine.analyze_drift(metrics, consecutive_stagnant_days=14)


@router.get("/calibration", response_model=Dict[str, Any])
async def get_calibration_divergence(
    current_user: User = Depends(get_current_user)
):
    """Retrieves computed prediction error/divergence margins across dimensions."""
    return PredictiveCalibrationEngine.calculate_divergence_metrics()


@router.get("/learning", response_model=Dict[str, Any])
async def get_trajectory_learning_summary(
    current_user: User = Depends(get_current_user)
):
    """Retrieves long-term trajectory learning patterns and discovered optimal skill paths."""
    return TrajectoryLearningLayer.get_learning_summary()
