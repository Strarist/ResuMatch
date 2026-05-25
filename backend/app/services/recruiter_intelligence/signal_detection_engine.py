"""Signal detection — infers recruiter-relevant strength and risk signals."""

from app.services.recruiter_intelligence.confidence_calibrator import calibrate, confidence_label
from app.services.recruiter_intelligence.evidence_extractor import extract_evidence


def detect_signals(
    skills: list[str],
    experience: list[dict],
    evidence: dict,
    skill_clusters: dict | None = None,
) -> dict:
    """Detect strength and risk signals from candidate data.

    Returns:
        {
            "strengths": [{"signal": str, "confidence": float, "label": str, "evidence": list}],
            "risks": [{"signal": str, "confidence": float, "label": str, "evidence": list}],
        }
    """
    strengths = []
    risks = []

    # === Strength Signals ===

    # Ownership/execution depth
    impact = evidence.get("impact_metrics", [])
    if impact:
        conf = calibrate(0.7, len(impact))
        strengths.append({
            "signal": "Execution depth with measurable impact",
            "confidence": conf, "label": confidence_label(conf),
            "evidence": impact[:3],
        })

    # Leadership
    leadership = evidence.get("leadership_signals", [])
    if leadership:
        conf = calibrate(0.6, len(leadership))
        strengths.append({
            "signal": "Leadership and team management experience",
            "confidence": conf, "label": confidence_label(conf),
            "evidence": leadership[:3],
        })

    # Architecture maturity
    arch = evidence.get("architecture_signals", [])
    if arch:
        conf = calibrate(0.65, len(arch))
        strengths.append({
            "signal": "System architecture and design capability",
            "confidence": conf, "label": confidence_label(conf),
            "evidence": arch[:3],
        })

    # Deployment maturity
    deploy = evidence.get("deployment_signals", [])
    if deploy:
        conf = calibrate(0.6, len(deploy))
        strengths.append({
            "signal": "Production deployment experience",
            "confidence": conf, "label": confidence_label(conf),
            "evidence": deploy[:3],
        })

    # Specialization depth (from clusters)
    if skill_clusters:
        for domain, domain_skills in skill_clusters.items():
            if len(domain_skills) >= 5:
                conf = calibrate(0.7, len(domain_skills))
                strengths.append({
                    "signal": f"Deep {domain} specialization",
                    "confidence": conf, "label": confidence_label(conf),
                    "evidence": domain_skills[:5],
                })

    # === Risk Signals ===

    # Missing impact metrics
    if not impact and len(experience) >= 2:
        risks.append({
            "signal": "No quantified impact metrics found",
            "confidence": 0.5, "label": "moderate",
            "evidence": ["Experience descriptions lack measurable outcomes"],
        })

    # Shallow breadth (many skills, no depth)
    if len(skills) > 20 and not any(len(v) >= 4 for v in (skill_clusters or {}).values()):
        risks.append({
            "signal": "Broad skill listing without demonstrated depth",
            "confidence": 0.45, "label": "low",
            "evidence": [f"{len(skills)} skills listed without clear specialization"],
        })

    # Short tenure pattern
    short_roles = sum(1 for e in experience if _is_short_tenure(e.get("duration", "")))
    if short_roles >= 3:
        risks.append({
            "signal": "Frequent short tenures detected",
            "confidence": calibrate(0.5, short_roles),
            "label": confidence_label(calibrate(0.5, short_roles)),
            "evidence": [f"{short_roles} roles with <1 year duration"],
        })

    return {"strengths": strengths, "risks": risks}


def _is_short_tenure(duration: str) -> bool:
    """Heuristic: detect sub-1-year tenures."""
    lower = duration.lower()
    if "month" in lower:
        try:
            months = int("".join(c for c in lower if c.isdigit())[:2])
            return months < 12
        except ValueError:
            pass
    return False
