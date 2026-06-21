"""Career Trajectory Engine — deterministic career direction inference.

No LLM dependency. Uses skill clusters, role templates, and weighted scoring.
"""

from __future__ import annotations

# === Role Templates: skills that define readiness for each role ===

ROLE_TEMPLATES: dict[str, dict] = {
    "Frontend Engineer": {
        "core": ["react", "typescript", "next.js", "javascript", "tailwind"],
        "supporting": ["redux", "css", "html", "testing", "git", "web performance"],
        "weight": {"core": 0.6, "supporting": 0.4},
    },
    "DevOps Engineer": {
        "core": ["docker", "kubernetes", "ci/cd", "linux", "terraform"],
        "supporting": ["aws", "gcp", "azure", "ansible", "monitoring", "git"],
        "weight": {"core": 0.7, "supporting": 0.3},
    },
    "Cloud Engineer": {
        "core": ["aws", "terraform", "kubernetes", "networking", "iam"],
        "supporting": ["docker", "linux", "ci/cd", "gcp", "azure", "serverless"],
        "weight": {"core": 0.7, "supporting": 0.3},
    },
    "Backend Engineer": {
        "core": ["python", "java", "spring boot", "postgresql", "sql", "redis", "rest api"],
        "supporting": ["docker", "fastapi", "django", "node.js", "microservices", "kafka", "testing"],
        "weight": {"core": 0.6, "supporting": 0.4},
    },
    "Full Stack Engineer": {
        "core": ["react", "node.js", "typescript", "postgresql", "rest api"],
        "supporting": ["next.js", "docker", "css", "html", "git", "testing"],
        "weight": {"core": 0.6, "supporting": 0.4},
    },
    "Platform Engineer": {
        "core": ["kubernetes", "terraform", "ci/cd", "docker", "observability"],
        "supporting": ["aws", "linux", "networking", "python", "go", "service mesh"],
        "weight": {"core": 0.7, "supporting": 0.3},
    },
    "ML Engineer": {
        "core": ["python", "machine learning", "pytorch", "tensorflow", "numpy"],
        "supporting": ["docker", "sql", "statistics", "data pipelines", "mlops"],
        "weight": {"core": 0.7, "supporting": 0.3},
    },
    "AI Engineer": {
        "core": ["python", "machine learning", "llm", "nlp", "embeddings"],
        "supporting": ["pytorch", "langchain", "vector databases", "rest api", "docker"],
        "weight": {"core": 0.7, "supporting": 0.3},
    },
    "SRE": {
        "core": ["linux", "monitoring", "kubernetes", "incident response", "slo/sli"],
        "supporting": ["docker", "terraform", "python", "networking", "aws"],
        "weight": {"core": 0.7, "supporting": 0.3},
    },
    "Data Engineer": {
        "core": ["sql", "python", "data pipelines", "spark", "airflow"],
        "supporting": ["aws", "kafka", "postgresql", "docker", "dbt"],
        "weight": {"core": 0.7, "supporting": 0.3},
    },
}

# === Domain clusters for specialization detection ===

DOMAIN_CLUSTERS: dict[str, list[str]] = {
    "infrastructure": ["docker", "kubernetes", "terraform", "ansible", "linux", "networking"],
    "cloud": ["aws", "gcp", "azure", "serverless", "iam", "cloudformation"],
    "backend": ["python", "fastapi", "django", "node.js", "rest api", "graphql", "sql", "postgresql", "java", "spring boot", "kafka", "microservices"],
    "frontend": ["react", "next.js", "typescript", "javascript", "css", "html", "vue", "angular"],
    "data": ["sql", "spark", "airflow", "kafka", "data pipelines", "dbt", "etl"],
    "ml": ["machine learning", "pytorch", "tensorflow", "numpy", "statistics", "scikit-learn"],
    "devops": ["ci/cd", "docker", "kubernetes", "monitoring", "git", "jenkins"],
}


def compute_trajectory(
    user_skills: list[str],
    skill_confidences: dict[str, float],
    completed_nodes: list[str],
    deferred_nodes: list[str],
    growth_velocity: float,
    previous_dominant: str | None = None,
) -> dict:
    """Compute full career trajectory snapshot.

    Returns:
        {
            "dominant_path": str,
            "secondary_paths": [str],
            "readiness_scores": {role: {score, matched, missing, confidence}},
            "specializations": {domain: {strength, skills, momentum}},
            "adjacent_roles": [{role, readiness, gap_skills}],
            "competitiveness_score": float,
            "drift_detected": bool,
            "drift_details": str | None,
            "confidence": float,
        }
    """
    user_set = set(s.lower() for s in user_skills)

    # 1. Role readiness scoring
    readiness = _compute_readiness(user_set, skill_confidences)

    # 2. Specialization detection
    specializations = _compute_specializations(user_set, skill_confidences, completed_nodes)

    # 3. Determine dominant and secondary paths
    sorted_roles = sorted(readiness.items(), key=lambda x: x[1]["score"], reverse=True)
    dominant = sorted_roles[0][0] if sorted_roles else "Generalist"
    secondary = [r[0] for r in sorted_roles[1:3] if r[1]["score"] >= 0.3]

    # 4. Adjacent role inference
    adjacent = _compute_adjacent_roles(readiness)

    # 5. Competitiveness score (weighted average of top readiness + velocity)
    top_score = sorted_roles[0][1]["score"] if sorted_roles else 0
    competitiveness = min(1.0, top_score * 0.7 + growth_velocity * 0.3)

    # 6. Career drift detection
    drift_detected = False
    drift_details = None
    if previous_dominant and previous_dominant != dominant:
        drift_detected = True
        drift_details = f"Trajectory shifted from {previous_dominant} to {dominant}"

    # 7. Confidence (based on skill count and confidence scores)
    avg_confidence = sum(skill_confidences.values()) / max(len(skill_confidences), 1)
    confidence = min(1.0, avg_confidence * 0.6 + min(len(user_skills) / 15, 1.0) * 0.4)

    return {
        "dominant_path": dominant,
        "secondary_paths": secondary,
        "readiness_scores": readiness,
        "specializations": specializations,
        "adjacent_roles": adjacent,
        "competitiveness_score": round(competitiveness, 3),
        "drift_detected": drift_detected,
        "drift_details": drift_details,
        "confidence": round(confidence, 3),
    }


def _compute_readiness(user_set: set[str], confidences: dict[str, float]) -> dict:
    """Score readiness for each role template."""
    results = {}
    for role, template in ROLE_TEMPLATES.items():
        core = template["core"]
        supporting = template["supporting"]
        w = template["weight"]

        core_matched = [s for s in core if s in user_set]
        support_matched = [s for s in supporting if s in user_set]

        core_score = len(core_matched) / max(len(core), 1)
        support_score = len(support_matched) / max(len(supporting), 1)
        raw_score = core_score * w["core"] + support_score * w["supporting"]

        # Weight by confidence of matched skills
        conf_boost = sum(confidences.get(s, 0.5) for s in core_matched) / max(len(core), 1)
        score = min(1.0, raw_score * 0.8 + conf_boost * 0.2)

        missing = [s for s in core if s not in user_set][:3]

        results[role] = {
            "score": round(score, 3),
            "matched_core": core_matched,
            "matched_supporting": support_matched,
            "missing_core": missing,
            "confidence": round(conf_boost, 3),
        }
    return results


def _compute_specializations(
    user_set: set[str], confidences: dict[str, float], completed_nodes: list[str]
) -> dict:
    """Detect domain specializations."""
    completed_set = set(n.lower() for n in completed_nodes)
    results = {}
    for domain, skills in DOMAIN_CLUSTERS.items():
        matched = [s for s in skills if s in user_set]
        if not matched:
            continue
        strength = len(matched) / len(skills)
        # Momentum: skills recently completed in this domain
        momentum = sum(1 for s in matched if s in completed_set) / max(len(matched), 1)
        avg_conf = sum(confidences.get(s, 0.5) for s in matched) / len(matched)

        results[domain] = {
            "strength": round(strength, 3),
            "skills": matched,
            "momentum": round(momentum, 3),
            "confidence": round(avg_conf, 3),
            "emerging": len(matched) >= 3 and strength < 0.6,
            "dominant": strength >= 0.6,
        }
    return results


def _compute_adjacent_roles(readiness: dict) -> list[dict]:
    """Find roles that are close to ready (0.4-0.7 score) with small gaps."""
    adjacent = []
    for role, data in readiness.items():
        if 0.35 <= data["score"] <= 0.75 and data["missing_core"]:
            adjacent.append({
                "role": role,
                "readiness": data["score"],
                "gap_skills": data["missing_core"],
            })
    adjacent.sort(key=lambda x: x["readiness"], reverse=True)
    return adjacent[:4]
