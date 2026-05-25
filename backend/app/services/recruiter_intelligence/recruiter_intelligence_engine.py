"""Recruiter intelligence engine — generates evidence-backed candidate intelligence."""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.intelligence import IntelligenceRepository
from app.services.intelligence.skill_normalizer import cluster_skills
from app.services.recruiter_intelligence.confidence_calibrator import calibrate, confidence_label
from app.services.recruiter_intelligence.evidence_extractor import extract_evidence
from app.services.recruiter_intelligence.recruiter_models import RecruiterIntelligenceSnapshot, ReasoningEvent
from app.services.recruiter_intelligence.signal_detection_engine import detect_signals

logger = logging.getLogger(__name__)


class RecruiterIntelligenceEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate(self, user_id: UUID, analysis_id: UUID, parsed_resume: dict) -> dict:
        """Generate recruiter intelligence from analysis results.

        Returns the full intelligence snapshot dict.
        """
        skills = parsed_resume.get("skills", [])
        experience = parsed_resume.get("experience", [])
        raw_text = " ".join(e.get("description", "") for e in experience)

        # Extract evidence
        evidence = extract_evidence(raw_text)

        # Cluster skills
        clusters = cluster_skills(skills)

        # Detect signals
        signals = detect_signals(skills, experience, evidence, clusters)

        # Load longitudinal data for confidence boost
        intel_repo = IntelligenceRepository(self.db)
        user_skills = await intel_repo.get_user_skills(user_id)
        avg_occurrences = sum(s.occurrence_count for s in user_skills) / max(len(user_skills), 1)

        # Build reasoning traces
        traces = []
        for strength in signals["strengths"]:
            traces.append({
                "claim": strength["signal"],
                "confidence": strength["confidence"],
                "evidence": strength["evidence"],
                "reasoning_path": [
                    f"Evidence detected: {len(strength['evidence'])} supporting signals",
                    f"Confidence calibrated: {strength['label']}",
                ],
            })

        # Intelligence summary
        top_strengths = [s["signal"] for s in signals["strengths"][:3]]
        top_domains = list(clusters.keys())[:3]
        summary = {
            "headline": _generate_headline(top_strengths, top_domains),
            "specialization": top_domains,
            "strength_count": len(signals["strengths"]),
            "risk_count": len(signals["risks"]),
            "overall_confidence": confidence_label(
                calibrate(0.6, len(signals["strengths"]), int(avg_occurrences))
            ),
        }

        # Confidence snapshot
        confidence_snapshot = {
            "evidence_density": len(evidence["impact_metrics"]) + len(evidence["leadership_signals"]),
            "longitudinal_depth": round(avg_occurrences, 1),
            "signal_coverage": len(signals["strengths"]) / 5,  # out of 5 possible signal types
        }

        # Persist snapshot
        snapshot = RecruiterIntelligenceSnapshot(
            user_id=user_id, analysis_id=analysis_id,
            intelligence_summary=summary,
            strength_signals=signals["strengths"],
            risk_signals=signals["risks"],
            reasoning_traces=traces,
            confidence_snapshot=confidence_snapshot,
        )
        self.db.add(snapshot)

        # Persist reasoning events
        for trace in traces:
            self.db.add(ReasoningEvent(
                user_id=user_id, analysis_id=analysis_id,
                reasoning_type="inferred_strength",
                evidence_chain=trace["evidence"],
                confidence_score=trace["confidence"],
                reasoning_snapshot=trace,
            ))

        await self.db.flush()
        logger.info(f"Recruiter intelligence generated for user {user_id}: {len(signals['strengths'])} strengths, {len(signals['risks'])} risks")

        return {
            "summary": summary,
            "strengths": signals["strengths"],
            "risks": signals["risks"],
            "reasoning": traces,
            "confidence": confidence_snapshot,
        }


def _generate_headline(strengths: list[str], domains: list[str]) -> str:
    if not strengths and not domains:
        return "Candidate profile under analysis"
    if domains:
        domain_str = " & ".join(d.capitalize() for d in domains[:2])
        if strengths:
            return f"{domain_str} engineer with {strengths[0].lower()}"
        return f"{domain_str} focused engineer"
    return strengths[0] if strengths else "Candidate profile"
