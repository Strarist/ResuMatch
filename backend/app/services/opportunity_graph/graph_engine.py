"""Opportunity Graph Engine - Graph based transition paths."""

def get_expansion_paths(current_role: str, specialization: str | None = None) -> list[dict]:
    """Identify adjacency paths for opportunity expansion."""

    # Mocked static graph for MVP
    graph = {
        "Software Engineer": ["Backend Engineer", "Fullstack Engineer", "Data Engineer"],
        "Backend Engineer": ["Distributed Systems Engineer", "Cloud Engineer", "Infrastructure Engineer"],
        "Cloud Engineer": ["DevOps Engineer", "Cloud Architect", "Infrastructure AI Engineer"],
        "DevOps Engineer": ["Platform Engineer", "SRE", "DevSecOps"]
    }

    adjacencies = graph.get(current_role, ["Senior " + current_role, "Lead " + current_role])

    paths = []
    for adj in adjacencies:
        paths.append({
            "target_role": adj,
            "readiness": 0.75, # Mock readiness
            "leverage_skill": "Kubernetes" if "DevOps" in adj or "Cloud" in adj else "System Design"
        })

    return paths
