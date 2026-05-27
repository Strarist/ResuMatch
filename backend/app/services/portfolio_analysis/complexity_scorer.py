"""Scores project sophistication and portfolio credibility."""

def score_portfolio_complexity(repo_analyses: list[dict]) -> dict:
    """Differentiate tutorial projects from production-ready systems."""
    if not repo_analyses:
        return {
            "overall_complexity": "beginner",
            "proof_density": 0.1,
            "credibility_score": 0.2
        }

    score = 0.0
    for repo in repo_analyses:
        if repo.get("has_ci_cd"): score += 0.3
        if repo.get("has_docker"): score += 0.2
        if repo.get("has_tests"): score += 0.2
        if repo.get("architecture_complexity") == "production-grade":
            score += 0.5
        elif repo.get("architecture_complexity") == "intermediate":
            score += 0.2

    avg_score = score / len(repo_analyses)

    if avg_score > 0.8:
        complexity = "production-grade"
    elif avg_score > 0.5:
        complexity = "advanced"
    elif avg_score > 0.2:
        complexity = "intermediate"
    else:
        complexity = "beginner"

    return {
        "overall_complexity": complexity,
        "proof_density": min(1.0, avg_score),
        "credibility_score": min(1.0, avg_score * 1.2)
    }
