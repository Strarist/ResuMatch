from app.models.strategic_memory import CausalEdge
from sqlalchemy.ext.asyncio import AsyncSession

class CausalGraphService:
    @staticmethod
    async def add_edge(db: AsyncSession, source_id: str, target_id: str, edge_type: str, weight: float):
        edge = CausalEdge(
            source_node_id=source_id,
            target_node_id=target_id,
            edge_type=edge_type,
            weight=weight
        )
        db.add(edge)
        await db.commit()
        return edge

    @staticmethod
    async def get_graph_topology(db: AsyncSession, user_id: str):
        # Stub for returning full causal ancestry
        return {
            "nodes": [
                {"id": "exec_1", "label": "Execution Consistency", "domain": "execution"},
                {"id": "rec_1", "label": "Recruiter Trust", "domain": "recruiter"},
                {"id": "port_1", "label": "Portfolio Maturity", "domain": "portfolio"}
            ],
            "edges": [
                {"source": "exec_1", "target": "rec_1", "type": "amplifies", "weight": 1.2},
                {"source": "port_1", "target": "rec_1", "type": "unlocks", "weight": 2.0}
            ]
        }
