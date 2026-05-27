from typing import Dict, Any, List
from app.services.prediction_engine.predictive_calibration import PredictiveCalibrationEngine

class PredictionLineageGraph:
    """Constructs a lineage graph mapping raw inputs to calibration layers and optimization outputs."""

    @classmethod
    def get_lineage_graph(cls) -> Dict[str, Any]:
        """Generates nodes and edges representing the predictive modeling causality pipeline."""
        coeffs = PredictiveCalibrationEngine.get_calibration_coefficients()

        # 1. Define nodes in the pipeline
        nodes = [
            {"id": "skills_input", "label": "Target Skill Alignment", "category": "INPUT", "value": 1.0},
            {"id": "outreach_input", "label": "Recruiter Outreach Volume", "category": "INPUT", "value": 1.0},
            {"id": "consistency_input", "label": "Execution Consistency", "category": "INPUT", "value": 1.0},

            {"id": "calibration_match", "label": f"Match Score Calibration ({coeffs.get('match_score_coeff', 1.0)})", "category": "CALIBRATION", "value": coeffs.get("match_score_coeff", 1.0)},
            {"id": "calibration_velocity", "label": f"Velocity Calibration ({coeffs.get('velocity_coeff', 1.0)})", "category": "CALIBRATION", "value": coeffs.get("velocity_coeff", 1.0)},
            {"id": "calibration_market", "label": f"Market Fit Calibration ({coeffs.get('market_fit_coeff', 1.0)})", "category": "CALIBRATION", "value": coeffs.get("market_fit_coeff", 1.0)},
            {"id": "calibration_recruiter", "label": f"Recruiter Conf. Calibration ({coeffs.get('recruiter_conf_coeff', 1.0)})", "category": "CALIBRATION", "value": coeffs.get("recruiter_conf_coeff", 1.0)},

            {"id": "opt_roadmap", "label": "Roadmap Sequence Optimization", "category": "OPTIMIZATION", "value": 1.0},
            {"id": "opt_outreach", "label": "Outreach Strategy Adjustment", "category": "OPTIMIZATION", "value": 1.0}
        ]

        # 2. Define edges connecting the nodes
        edges = [
            # Inputs to Calibration Layers
            {
                "source": "skills_input",
                "target": "calibration_match",
                "weight": round(0.5 * coeffs.get("match_score_coeff", 1.0), 2),
                "description": "Skill overlap maps directly to calibrated match score heuristics."
            },
            {
                "source": "consistency_input",
                "target": "calibration_velocity",
                "weight": round(0.6 * coeffs.get("velocity_coeff", 1.0), 2),
                "description": "Execution consistency determines career velocity projections."
            },
            {
                "source": "skills_input",
                "target": "calibration_market",
                "weight": round(0.4 * coeffs.get("market_fit_coeff", 1.0), 2),
                "description": "Selected skill tags define overall market demand metrics."
            },
            {
                "source": "outreach_input",
                "target": "calibration_recruiter",
                "weight": round(0.7 * coeffs.get("recruiter_conf_coeff", 1.0), 2),
                "description": "Outreach activity levels directly calibrate recruiter trust score."
            },

            # Calibration to Optimization Outputs
            {
                "source": "calibration_match",
                "target": "opt_roadmap",
                "weight": 0.4,
                "description": "Calibrated match score determines initial roadmap priorities."
            },
            {
                "source": "calibration_velocity",
                "target": "opt_roadmap",
                "weight": 0.3,
                "description": "Velocity projections pace target roadmap milestone intervals."
            },
            {
                "source": "calibration_market",
                "target": "opt_roadmap",
                "weight": 0.3,
                "description": "Market fit filters align prioritized nodes to highest-leverage skills."
            },
            {
                "source": "calibration_recruiter",
                "target": "opt_outreach",
                "weight": 0.8,
                "description": "Recruiter trust limits optimal communication schedules."
            }
        ]

        return {
            "nodes": nodes,
            "edges": edges
        }
