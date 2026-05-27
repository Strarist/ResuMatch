import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

SIMULATION_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "simulation_history.json"
)

class PredictiveMemoryLayer:
    """Persists historical simulation snapshots, tracks forecast success metrics, and calibrates scores."""

    _snapshots_cache: List[Dict[str, Any]] = []
    _initialized: bool = False

    @classmethod
    def _load_snapshots(cls) -> List[Dict[str, Any]]:
        """Loads snapshots from the persistent JSON store."""
        if cls._initialized:
            return cls._snapshots_cache

        if not os.path.exists(SIMULATION_FILE):
            cls._snapshots_cache = []
            cls._initialized = True
            return cls._snapshots_cache

        try:
            with open(SIMULATION_FILE, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:
                    cls._snapshots_cache = []
                else:
                    cls._snapshots_cache = json.loads(content)
        except Exception:
            cls._snapshots_cache = []

        cls._initialized = True
        return cls._snapshots_cache

    @classmethod
    def _save_snapshots(cls) -> None:
        """Saves current snapshots cache to the persistent JSON store."""
        try:
            with open(SIMULATION_FILE, "w", encoding="utf-8") as f:
                json.dump(cls._snapshots_cache, f, indent=2, ensure_ascii=False)
        except Exception as e:
            # Fallback/Log exception silently or log if logger is available
            print(f"Error saving predictive snapshots: {e}")

    @classmethod
    def save_snapshot(cls, name: str, parameters: Dict[str, Any], results: Dict[str, Any]) -> Dict[str, Any]:
        """Saves a simulation snapshot to history."""
        cls._load_snapshots()

        snapshot_id = f"sim_{uuid.uuid4().hex[:12]}"
        snapshot = {
            "id": snapshot_id,
            "name": name or f"Simulation {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "parameters": parameters,
            "results": results,
            "accuracy_metric": None,
            "actual_outcome_compared": None
        }

        cls._snapshots_cache.insert(0, snapshot)
        # Cap at 50 snapshots to prevent unbounded growth
        cls._snapshots_cache = cls._snapshots_cache[:50]
        cls._save_snapshots()
        return snapshot

    @classmethod
    def get_snapshots(cls) -> List[Dict[str, Any]]:
        """Retrieves all historical simulation snapshots."""
        return cls._load_snapshots()

    @classmethod
    def get_snapshot(cls, snapshot_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single snapshot by ID."""
        snapshots = cls._load_snapshots()
        for snap in snapshots:
            if snap["id"] == snapshot_id:
                return snap
        return None

    @classmethod
    def delete_snapshot(cls, snapshot_id: str) -> bool:
        """Deletes a snapshot by ID."""
        cls._load_snapshots()
        initial_len = len(cls._snapshots_cache)
        cls._snapshots_cache = [s for s in cls._snapshots_cache if s["id"] != snapshot_id]
        if len(cls._snapshots_cache) < initial_len:
            cls._save_snapshots()
            return True
        return False

    @classmethod
    def track_forecast_success(cls, snapshot_id: str, actual_outcome: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Compares predicted metrics in a snapshot with actual outcomes to track and save accuracy."""
        cls._load_snapshots()
        for snap in cls._snapshots_cache:
            if snap["id"] == snapshot_id:
                predicted_metrics = snap["results"].get("metrics", {})

                # Calculate simple absolute variance percentage across common metrics
                variances = []
                for key in ["matchScore", "careerVelocity", "marketFit", "recruiterConfidence"]:
                    pred_val = predicted_metrics.get(key)
                    act_val = actual_outcome.get(key)
                    if pred_val is not None and act_val is not None:
                        diff = abs(pred_val - act_val)
                        # Avoid division by zero
                        base = max(1.0, float(pred_val))
                        variance = (diff / base)
                        variances.append(variance)

                if variances:
                    avg_variance = sum(variances) / len(variances)
                    accuracy = round(max(0.0, 1.0 - avg_variance), 2)
                else:
                    accuracy = 1.0

                snap["accuracy_metric"] = accuracy
                snap["actual_outcome_compared"] = actual_outcome
                cls._save_snapshots()
                return snap
        return None

    @classmethod
    def calibrate_scores(cls, current_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Provides calibration coefficients based on past simulation accuracy."""
        snapshots = cls._load_snapshots()
        accuracies = [s["accuracy_metric"] for s in snapshots if s.get("accuracy_metric") is not None]

        # Default calibration values
        calibration_factor = 1.0
        confidence_multiplier = 1.0

        if accuracies:
            avg_accuracy = sum(accuracies) / len(accuracies)
            # If past predictions were less accurate, reduce confidence multiplier slightly to reflect uncertainty
            if avg_accuracy < 0.8:
                confidence_multiplier = round(0.8 + (avg_accuracy * 0.2), 2)
                calibration_factor = round(0.9 + (avg_accuracy * 0.1), 2)
            elif avg_accuracy > 0.95:
                confidence_multiplier = 1.05
                calibration_factor = 1.02

        return {
            "calibration_factor": calibration_factor,
            "confidence_multiplier": confidence_multiplier,
            "historical_accuracy": round(sum(accuracies) / len(accuracies), 2) if accuracies else 1.0,
            "calibrated_at": datetime.utcnow().isoformat() + "Z"
        }
