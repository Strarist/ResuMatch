import os
import json
from datetime import datetime
from typing import Dict, Any, List

LEARNING_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "trajectory_learning.json"
)

class TrajectoryLearningLayer:
    """Records learning outcome logs and tracks which career paths yield the highest actual velocity gains."""

    _logs_cache: List[Dict[str, Any]] = []
    _initialized: bool = False

    @classmethod
    def _load_logs(cls) -> List[Dict[str, Any]]:
        if cls._initialized:
            return cls._logs_cache

        if not os.path.exists(LEARNING_FILE):
            cls._logs_cache = []
            cls._initialized = True
            return cls._logs_cache

        try:
            with open(LEARNING_FILE, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:
                    cls._logs_cache = []
                else:
                    cls._logs_cache = json.loads(content)
        except Exception:
            cls._logs_cache = []

        cls._initialized = True
        return cls._logs_cache

    @classmethod
    def _save_logs(cls) -> None:
        try:
            with open(LEARNING_FILE, "w", encoding="utf-8") as f:
                json.dump(cls._logs_cache, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving learning logs: {e}")

    @classmethod
    def record_learning_node(
        cls,
        snapshot_id: str,
        parameters: Dict[str, Any],
        actual_growth: Dict[str, float]
    ) -> Dict[str, Any]:
        """Logs a calibration outcome to build a learning model of execution vectors."""
        cls._load_logs()

        log_entry = {
            "snapshot_id": snapshot_id,
            "recorded_at": datetime.utcnow().isoformat() + "Z",
            "skills_targeted": parameters.get("improved_skills", []),
            "projects_shipped": parameters.get("shipped_projects", 0),
            "actual_growth_metrics": actual_growth,
            # Net actual velocity increase
            "net_velocity_gain": actual_growth.get("careerVelocity", 0.0) - actual_growth.get("matchScore", 0.0) * 0.1
        }

        cls._logs_cache.append(log_entry)
        # Cap at 100 entries
        cls._logs_cache = cls._logs_cache[-100:]
        cls._save_logs()
        return log_entry

    @classmethod
    def get_learning_summary(cls) -> Dict[str, Any]:
        """Processes learning history logs to output top-performing execution patterns."""
        logs = cls._load_logs()
        if not logs:
            return {
                "total_learned_cycles": 0,
                "optimal_skills_discovered": ["FastAPI", "Next.js", "Redis"],
                "project_velocity_multiplier": 1.0,
                "message": "Insufficient learning data. Utilizing baseline market heuristics."
            }

        # Analyze which skills yield highest actual careerVelocity
        skill_impacts: Dict[str, List[float]] = {}
        for entry in logs:
            skills = entry["skills_targeted"]
            gain = entry.get("actual_growth_metrics", {}).get("careerVelocity", 0.0)

            for s in skills:
                normalized = s.capitalize()
                if normalized not in skill_impacts:
                    skill_impacts[normalized] = []
                skill_impacts[normalized].append(gain)

        # Average gains per skill
        avg_gains = []
        for s, gains in skill_impacts.items():
            avg_gains.append({
                "skill": s,
                "average_gain": round(sum(gains) / len(gains), 1)
            })

        avg_gains.sort(key=lambda x: x["average_gain"], reverse=True)
        optimal_skills = [item["skill"] for item in avg_gains[:3]]

        # Fallback to defaults if list is too small
        if len(optimal_skills) < 2:
            optimal_skills.extend([s for s in ["FastAPI", "Next.js", "Redis"] if s not in optimal_skills])

        return {
            "total_learned_cycles": len(logs),
            "optimal_skills_discovered": optimal_skills[:3],
            "average_velocity_gains": avg_gains,
            "message": "Calibration models actively tuning strategic optimization parameters."
        }
