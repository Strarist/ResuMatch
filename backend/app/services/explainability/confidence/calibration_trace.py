from datetime import datetime
from typing import Dict, Any, List
from app.services.prediction_engine.predictive_memory import PredictiveMemoryLayer

class CalibrationTrace:
    """Tracks how calibration factors and validation accuracy shifted over time."""

    @classmethod
    def get_trace_history(cls) -> List[Dict[str, Any]]:
        """Processes historical comparisons to output chronological calibration events."""
        snapshots = PredictiveMemoryLayer.get_snapshots()
        calibrated_snaps = [s for s in snapshots if s.get("accuracy_metric") is not None]

        traces = []
        for i, snap in enumerate(reversed(calibrated_snaps)):
            traces.append({
                "iteration": i + 1,
                "timestamp": snap.get("timestamp", datetime.utcnow().isoformat() + "Z"),
                "snapshot_name": snap.get("name", "Scenario"),
                "evaluated_accuracy": snap.get("accuracy_metric", 1.0),
                "actual_outcome": snap.get("actual_outcome_compared", {})
            })

        # Add a default/initial trace event if none are saved yet
        if not traces:
            traces.append({
                "iteration": 1,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "snapshot_name": "System Baseline Initialization",
                "evaluated_accuracy": 1.0,
                "actual_outcome": {
                    "matchScore": 94.0,
                    "careerVelocity": 78.0,
                    "marketFit": 91.0,
                    "recruiterConfidence": 87.0
                }
            })

        return traces
