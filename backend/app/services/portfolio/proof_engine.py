"""Portfolio Proof Engine — measures real capability evidence from projects.

Maturity levels: learning → functional → deployable → production_ready → scalable → differentiated
"""

from __future__ import annotations
import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Boolean, func
from app.models.base import Base


class ProjectEvidence(Base):
    __tablename__ = "project_evidence"
    __table_args__ = (Index("ix_project_evidence_user", "user_id"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_name = Column(String, nullable=False)
    github_url = Column(String, nullable=True)
    live_url = Column(String, nullable=True)
    description = Column(String, nullable=True)
    stack = Column(JSON, default=list)
    deployment_platform = Column(String, nullable=True)
    ci_cd_present = Column(Boolean, default=False)
    dockerized = Column(Boolean, default=False)
    cloud_services_used = Column(JSON, default=list)
    ai_features_present = Column(Boolean, default=False)
    testing_present = Column(Boolean, default=False)
    documentation_score = Column(Integer, default=0)  # 0-10
    architecture_complexity = Column(String, default="basic")  # basic, intermediate, advanced, production_grade, distributed_system
    production_readiness_score = Column(Float, default=0.0)
    recruiter_signal_strength = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# === Proof Scoring ===

PRODUCTION_WEIGHTS = {
    "deployed": 0.15,
    "ci_cd": 0.12,
    "dockerized": 0.10,
    "cloud": 0.12,
    "auth": 0.08,
    "testing": 0.10,
    "documentation": 0.08,
    "observability": 0.08,
    "scalability": 0.07,
    "ai_integration": 0.10,
}

COMPLEXITY_SCORES = {"basic": 0.2, "intermediate": 0.4, "advanced": 0.6, "production_grade": 0.8, "distributed_system": 1.0}
MATURITY_LEVELS = ["learning", "functional", "deployable", "production_ready", "scalable", "differentiated"]


def score_project(project: dict) -> dict:
    """Score a single project for production readiness and recruiter signal."""
    signals = 0.0
    signals += PRODUCTION_WEIGHTS["deployed"] * (1.0 if project.get("live_url") or project.get("deployment_platform") else 0.0)
    signals += PRODUCTION_WEIGHTS["ci_cd"] * (1.0 if project.get("ci_cd_present") else 0.0)
    signals += PRODUCTION_WEIGHTS["dockerized"] * (1.0 if project.get("dockerized") else 0.0)
    signals += PRODUCTION_WEIGHTS["cloud"] * (min(1.0, len(project.get("cloud_services_used", [])) / 2))
    signals += PRODUCTION_WEIGHTS["testing"] * (1.0 if project.get("testing_present") else 0.0)
    signals += PRODUCTION_WEIGHTS["documentation"] * (min(1.0, project.get("documentation_score", 0) / 7))
    signals += PRODUCTION_WEIGHTS["ai_integration"] * (1.0 if project.get("ai_features_present") else 0.0)

    complexity = COMPLEXITY_SCORES.get(project.get("architecture_complexity", "basic"), 0.2)
    production_readiness = round(min(1.0, signals + complexity * 0.15), 3)
    recruiter_signal = round(production_readiness * 0.7 + complexity * 0.3, 3)

    return {"production_readiness_score": production_readiness, "recruiter_signal_strength": recruiter_signal}


def compute_portfolio_maturity(projects: list[dict]) -> dict:
    """Compute overall portfolio maturity from all projects."""
    if not projects:
        return {"level": "learning", "score": 0.0, "project_count": 0, "strongest_signal": None}

    scores = [score_project(p) for p in projects]
    avg_readiness = sum(s["production_readiness_score"] for s in scores) / len(scores)
    max_signal = max(s["recruiter_signal_strength"] for s in scores)
    deployed_count = sum(1 for p in projects if p.get("live_url") or p.get("deployment_platform"))

    # Composite maturity
    composite = avg_readiness * 0.4 + max_signal * 0.3 + min(1.0, deployed_count / 3) * 0.3

    if composite >= 0.85:
        level = "differentiated"
    elif composite >= 0.7:
        level = "scalable"
    elif composite >= 0.55:
        level = "production_ready"
    elif composite >= 0.4:
        level = "deployable"
    elif composite >= 0.2:
        level = "functional"
    else:
        level = "learning"

    strongest = max(projects, key=lambda p: score_project(p)["recruiter_signal_strength"]) if projects else None

    return {
        "level": level,
        "score": round(composite, 3),
        "project_count": len(projects),
        "deployed_count": deployed_count,
        "avg_readiness": round(avg_readiness, 3),
        "strongest_signal": strongest.get("project_name") if strongest else None,
    }
