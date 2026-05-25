"""Recruiter intelligence API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.dependencies import get_current_user
from app.models import User
from app.services.recruiter_intelligence.recruiter_models import RecruiterIntelligenceSnapshot, ReasoningEvent

router = APIRouter(prefix="/v1/recruiter", tags=["Recruiter Intelligence"])


@router.get("/intelligence")
async def get_intelligence(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RecruiterIntelligenceSnapshot)
        .where(RecruiterIntelligenceSnapshot.user_id == current_user.id)
        .order_by(RecruiterIntelligenceSnapshot.generated_at.desc())
        .limit(1)
    )
    snapshot = result.scalar_one_or_none()
    if not snapshot:
        return {"intelligence": None}
    return {
        "intelligence": {
            "summary": snapshot.intelligence_summary,
            "strengths": snapshot.strength_signals,
            "risks": snapshot.risk_signals,
            "confidence": snapshot.confidence_snapshot,
            "generated_at": snapshot.generated_at,
        }
    }


@router.get("/reasoning")
async def get_reasoning(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RecruiterIntelligenceSnapshot)
        .where(RecruiterIntelligenceSnapshot.user_id == current_user.id)
        .order_by(RecruiterIntelligenceSnapshot.generated_at.desc())
        .limit(1)
    )
    snapshot = result.scalar_one_or_none()
    if not snapshot:
        return {"reasoning": []}
    return {"reasoning": snapshot.reasoning_traces or []}


@router.get("/signals")
async def get_signals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RecruiterIntelligenceSnapshot)
        .where(RecruiterIntelligenceSnapshot.user_id == current_user.id)
        .order_by(RecruiterIntelligenceSnapshot.generated_at.desc())
        .limit(1)
    )
    snapshot = result.scalar_one_or_none()
    if not snapshot:
        return {"strengths": [], "risks": []}
    return {"strengths": snapshot.strength_signals or [], "risks": snapshot.risk_signals or []}


@router.get("/evidence")
async def get_evidence(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReasoningEvent)
        .where(ReasoningEvent.user_id == current_user.id)
        .order_by(ReasoningEvent.created_at.desc())
        .limit(20)
    )
    events = result.scalars().all()
    return {
        "evidence": [
            {
                "type": e.reasoning_type,
                "confidence": e.confidence_score,
                "evidence_chain": e.evidence_chain,
                "snapshot": e.reasoning_snapshot,
                "created_at": e.created_at,
            }
            for e in events
        ]
    }
