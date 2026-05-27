class PayloadMinimizer:
    """Removes empty or null fields to further shrink the payload."""

    @staticmethod
    def minimize(payload: dict) -> dict:
        """Strips out nulls and empty structures if not explicitly requested."""
        minimized = {}
        for k, v in payload.items():
            if v is not None:
                minimized[k] = v
        return minimized

def normalize_runtime_payload(payload: dict) -> dict:
    """Normalizes the payload to ensure structural continuity before SSE emission."""
    if not isinstance(payload, dict):
        payload = {}

    # 1. Add versioning
    payload["runtime_version"] = "10.3.2"

    # 2. Ensure orchestration exists
    if "orchestration" not in payload or payload["orchestration"] is None:
        payload["orchestration"] = {}

    orch = payload["orchestration"]
    if not isinstance(orch, dict):
        orch = {}
        payload["orchestration"] = orch

    # Ensure properties exist with safe defaults
    if "directive" not in orch:
        orch["directive"] = None

    if "topology" not in orch or orch["topology"] is None:
        orch["topology"] = []

    if "telemetry" not in orch or orch["telemetry"] is None:
        orch["telemetry"] = []

    if "agent_activity" not in orch or orch["agent_activity"] is None:
        orch["agent_activity"] = []

    if "constraints" not in orch or orch["constraints"] is None:
        orch["constraints"] = []

    # Let's ensure top-level structures default safely too
    if "propagation" not in payload or payload["propagation"] is None:
        payload["propagation"] = []

    if "graph" not in payload or payload["graph"] is None:
        payload["graph"] = {
            "nodes": [],
            "edges": []
        }
    else:
        graph = payload["graph"]
        if not isinstance(graph, dict):
            payload["graph"] = {"nodes": [], "edges": []}
        else:
            if "nodes" not in graph or graph["nodes"] is None:
                graph["nodes"] = []
            if "edges" not in graph or graph["edges"] is None:
                graph["edges"] = []

    return payload
