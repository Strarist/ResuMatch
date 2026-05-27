"""Recruiter Ecosystem — accounts, pipelines, discovery, comparison.

Multi-sided talent marketplace with deterministic, explainable ranking.
"""

from __future__ import annotations
import uuid

from sqlalchemy import Column, DateTime, Float, Index, Integer, JSON, String, Boolean, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base


# === Models ===

class RecruiterAccount(Base):
    __tablename__ = "recruiter_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, unique=True, index=True)
    organization_name = Column(String, nullable=False)
    recruiter_name = Column(String, nullable=False)
    work_email = Column(String, nullable=False)
    company_domain = Column(String, nullable=True)
    role_title = Column(String, default="Recruiter")
    recruiter_tier = Column(String, default="recruiter_free")
    verification_status = Column(String, default="pending")
    hiring_focus_domains = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RecruiterPipeline(Base):
    __tablename__ = "recruiter_pipelines"
    __table_args__ = (Index("ix_pipeline_recruiter", "recruiter_id"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recruiter_id = Column(String(36), nullable=False, index=True)
    title = Column(String, nullable=False)
    target_role = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PipelineCandidate(Base):
    __tablename__ = "pipeline_candidates"
    __table_args__ = (Index("ix_pipeline_candidate", "pipeline_id", "candidate_id"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pipeline_id = Column(String(36), nullable=False, index=True)
    candidate_id = Column(String(36), nullable=False)
    stage = Column(String, default="discovered")
    notes = Column(String, nullable=True)
    recruiter_score = Column(Float, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())


class RecruiterEngagementEvent(Base):
    __tablename__ = "recruiter_engagement_events"
    __table_args__ = (Index("ix_recruiter_engagement", "recruiter_id", "created_at"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recruiter_id = Column(String(36), nullable=False)
    candidate_id = Column(String(36), nullable=False)
    event_type = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# === Discovery Engine ===

def rank_candidates(candidates: list[dict], filters: dict | None = None) -> list[dict]:
    """Rank candidates by weighted recruiter-fit scoring. Deterministic and explainable."""
    results = []
    for c in candidates:
        # Weighted composite
        score = (
            c.get("recruiter_readiness", 0) * 0.25 +
            c.get("production_readiness", 0) * 0.2 +
            c.get("execution_credibility", 0) * 0.15 +
            c.get("specialization_strength", 0) * 0.15 +
            c.get("reputation_score", 0) * 0.1 +
            c.get("competitiveness", 0) * 0.1 +
            c.get("portfolio_strength", 0) * 0.05
        )

        # Apply filters
        if filters:
            if filters.get("min_readiness") and c.get("recruiter_readiness", 0) < filters["min_readiness"]:
                continue
            if filters.get("domain") and filters["domain"] not in c.get("domains", []):
                continue

        signals = []
        if c.get("production_readiness", 0) >= 0.6:
            signals.append("Production-ready portfolio")
        if c.get("execution_credibility", 0) >= 0.6:
            signals.append("Consistent execution track record")
        if c.get("specialization_strength", 0) >= 0.6:
            signals.append("Deep specialization")

        results.append({
            "candidate_id": c.get("id"),
            "alignment_score": round(score, 3),
            "recruiter_fit_score": round(c.get("recruiter_readiness", 0), 3),
            "strongest_signals": signals[:3],
            "proof_strength": round(c.get("portfolio_strength", 0), 3),
            "specialization_summary": c.get("dominant_path", ""),
            "momentum_state": c.get("momentum_state", "unknown"),
        })

    results.sort(key=lambda x: x["alignment_score"], reverse=True)
    return results


# === Comparison Engine ===

def compare_candidates(candidate_a: dict, candidate_b: dict) -> dict:
    """Compare two candidates across all dimensions. Deterministic."""
    dimensions = [
        ("recruiter_readiness", "Recruiter Readiness"),
        ("production_readiness", "Production Readiness"),
        ("execution_credibility", "Execution Credibility"),
        ("specialization_strength", "Specialization"),
        ("competitiveness", "Competitiveness"),
        ("portfolio_strength", "Portfolio"),
        ("reputation_score", "Reputation"),
    ]

    a_wins = 0
    b_wins = 0
    comparison = []

    for key, label in dimensions:
        a_val = candidate_a.get(key, 0)
        b_val = candidate_b.get(key, 0)
        winner = "a" if a_val > b_val else "b" if b_val > a_val else "tie"
        if winner == "a":
            a_wins += 1
        elif winner == "b":
            b_wins += 1
        comparison.append({"dimension": label, "a": round(a_val, 3), "b": round(b_val, 3), "winner": winner})

    stronger = "a" if a_wins > b_wins else "b" if b_wins > a_wins else "tie"

    return {
        "stronger_candidate": stronger,
        "a_wins": a_wins,
        "b_wins": b_wins,
        "comparison": comparison,
        "recommendation": f"Candidate {'A' if stronger == 'a' else 'B'} is stronger overall" if stronger != "tie" else "Candidates are closely matched",
    }


# === Repository helpers ===

async def get_recruiter_account(db: AsyncSession, user_id: str) -> RecruiterAccount | None:
    result = await db.execute(select(RecruiterAccount).where(RecruiterAccount.user_id == user_id))
    return result.scalar_one_or_none()


async def get_pipelines(db: AsyncSession, recruiter_id: str) -> list[RecruiterPipeline]:
    result = await db.execute(select(RecruiterPipeline).where(RecruiterPipeline.recruiter_id == recruiter_id).order_by(RecruiterPipeline.created_at.desc()))
    return list(result.scalars().all())


async def get_pipeline_candidates(db: AsyncSession, pipeline_id: str) -> list[PipelineCandidate]:
    result = await db.execute(select(PipelineCandidate).where(PipelineCandidate.pipeline_id == pipeline_id).order_by(PipelineCandidate.added_at.desc()))
    return list(result.scalars().all())
