from typing import List, Dict, Any

class RoadmapProjector:
    """Projects future roadmap learning nodes based on market needs."""

    @staticmethod
    def project_nodes(skills: List[str]) -> List[Dict[str, Any]]:
        nodes = []
        lower_skills = [s.lower() for s in skills]

        if "fastapi" not in lower_skills:
            nodes.append({
                "phase": "Phase 1 - Backend Speed",
                "node_title": "Asynchronous REST Services (FastAPI)",
                "difficulty": "Medium",
                "estimated_weeks": 2
            })
        if "next.js" not in lower_skills:
            nodes.append({
                "phase": "Phase 2 - Frontend Telemetry",
                "node_title": "Asymmetric Stream Hydration (Next.js)",
                "difficulty": "High",
                "estimated_weeks": 3
            })

        nodes.append({
            "phase": "Phase 3 - Scale Architecture",
            "node_title": "Distributed State Replay Logs",
            "difficulty": "High",
            "estimated_weeks": 4
        })

        return nodes
