"""Project Classifier — analyzes and scores candidate project complexity and domain alignments."""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

COMPLEXITY_MARKERS = {
    "distributed_systems": [
        "redis", "kafka", "rabbitmq", "grpc", "protobuf", "replication",
        "sharding", "consistency", "raft", "load balancer", "caching"
    ],
    "machine_learning": [
        "pytorch", "tensorflow", "cuda", "gpu", "inference", "transformer",
        "llm", "fine-tuning", "bert", "embeddings", "vector search"
    ],
    "cloud_infrastructure": [
        "kubernetes", "docker", "terraform", "aws", "gcp", "azure",
        "ingress", "istio", "helm", "ansible", "serverless"
    ],
    "frontend_architecture": [
        "next.js", "react", "vue", "tailwind", "webpack", "vite",
        "state management", "server-side rendering", "ssr", "micro-frontends"
    ]
}

def classify_project(project_name: str, desc: str, tech_stack: List[str]) -> Dict[str, Any]:
    """Classify technical complexity and assign category scores based on technology tags and descriptions."""
    combined_text = f"{project_name} {desc} {' '.join(tech_stack)}".lower()

    assigned_domains = []
    complexity_score = 0.50 # Baseline complexity

    for domain, markers in COMPLEXITY_MARKERS.items():
        overlap = [m for m in markers if m in combined_text]
        if overlap:
            assigned_domains.append(domain)
            # Increase complexity based on technology density
            complexity_score += len(overlap) * 0.08

    # Cap complexity score at 0.98
    complexity_score = min(0.98, complexity_score)

    return {
        "project_name": project_name,
        "complexity_score": round(complexity_score, 2),
        "primary_domain": assigned_domains[0] if assigned_domains else "general_software",
        "classification_signals": [d.replace("_", " ").title() for d in assigned_domains]
    }
