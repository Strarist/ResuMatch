"""Public Career Profile — generates recruiter-facing public profiles."""

from __future__ import annotations
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, JSON, String, func
from app.models.base import Base


class PublicCareerProfile(Base):
    __tablename__ = "public_career_profiles"
    __table_args__ = (Index("ix_public_profile_slug", "username_slug", unique=True),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    username_slug = Column(String, nullable=False, unique=True)
    visibility = Column(String, default="private")  # private, recruiter_only, public
    headline = Column(String, nullable=True)
    specialization_summary = Column(String, nullable=True)
    recruiter_readiness = Column(Float, default=0.0)
    portfolio_maturity = Column(String, default="learning")
    strongest_signals = Column(JSON, default=list)
    top_projects = Column(JSON, default=list)
    proof_summary = Column(JSON, default=dict)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


def generate_public_profile(
    user_name: str,
    trajectory: dict,
    recruiter_profile: dict,
    execution_profile: dict,
    portfolio_projects: list[dict],
) -> dict:
    """Generate public profile data from intelligence state."""
    dominant = trajectory.get("dominant_path", "Engineer")
    specs = trajectory.get("specializations", {})
    dominant_specs = [d for d, s in specs.items() if s.get("dominant") or s.get("strength", 0) >= 0.5]

    headline = f"{dominant} • {dominant_specs[0].title() if dominant_specs else 'Multi-domain'} Specialist"
    spec_summary = f"Specializing in {', '.join(dominant_specs[:2]).title()}" if dominant_specs else "Building specialization"

    top_projects = [{"name": p.get("project_name"), "stack": p.get("stack", [])[:4], "deployed": bool(p.get("live_url"))} for p in portfolio_projects[:4]]

    return {
        "headline": headline,
        "specialization_summary": spec_summary,
        "recruiter_readiness": recruiter_profile.get("recruiter_readiness", 0),
        "portfolio_maturity": recruiter_profile.get("portfolio_maturity", "learning"),
        "strongest_signals": recruiter_profile.get("strongest_signals", [])[:5],
        "top_projects": top_projects,
        "proof_summary": {
            "production_readiness": recruiter_profile.get("production_readiness", 0),
            "execution_credibility": recruiter_profile.get("execution_credibility", 0),
            "differentiation": recruiter_profile.get("differentiation_score", 0),
        },
    }
