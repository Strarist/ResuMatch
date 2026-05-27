"""Career Copilot Engine — deterministic strategic career responses.

Uses unified intelligence context to generate career-focused responses.
No LLM dependency. Pattern-matched strategic guidance.
"""

from __future__ import annotations


def generate_copilot_response(user_message: str, intelligence_summary: dict, recommendations: list[dict]) -> str:
    """Generate a strategic copilot response based on user message and intelligence context."""
    msg = user_message.lower().strip()

    # Route to appropriate response generator
    if any(kw in msg for kw in ["roadmap", "next skill", "what should i learn", "priority"]):
        return _roadmap_response(intelligence_summary, recommendations)
    elif any(kw in msg for kw in ["salary", "compensation", "pay", "earning"]):
        return _salary_response(intelligence_summary)
    elif any(kw in msg for kw in ["role", "ready", "readiness", "job", "position"]):
        return _role_response(intelligence_summary)
    elif any(kw in msg for kw in ["project", "build", "portfolio"]):
        return _project_response(intelligence_summary, recommendations)
    elif any(kw in msg for kw in ["market", "demand", "trend", "opportunity"]):
        return _market_response(intelligence_summary)
    elif any(kw in msg for kw in ["specializ", "strength", "domain"]):
        return _specialization_response(intelligence_summary)
    elif any(kw in msg for kw in ["recommend", "suggest", "advice", "strategy"]):
        return _recommendations_response(recommendations)
    elif any(kw in msg for kw in ["summary", "overview", "status", "where am i"]):
        return _summary_response(intelligence_summary)
    else:
        return _default_response(intelligence_summary, recommendations)


def _summary_response(s: dict) -> str:
    path = s.get("dominant_path", "Unknown")
    comp = int(s.get("competitiveness", 0) * 100)
    market = int(s.get("market_alignment", 0) * 100)
    growth = s.get("growth_potential", "moderate")
    focus = ", ".join(s.get("focus_areas", [])[:3]) or "not set"
    return (
        f"**Career Summary**\n\n"
        f"Your dominant trajectory is **{path}** with {comp}% competitiveness and {market}% market alignment.\n\n"
        f"Growth potential: **{growth}**. Current focus areas: {focus}.\n\n"
        f"{'⚠️ ' + s['drift_details'] if s.get('drift_detected') else 'Your trajectory is stable.'}"
    )


def _roadmap_response(s: dict, recs: list[dict]) -> str:
    focus = s.get("focus_areas", [])[:3]
    skill_recs = [r for r in recs if r["type"] == "next_skill"]
    lines = ["**Roadmap Priority**\n"]
    if focus:
        lines.append(f"Current focus: {', '.join(focus)}\n")
    if skill_recs:
        for r in skill_recs[:3]:
            lines.append(f"• **{r['title']}** — {r['explanation']}")
    else:
        lines.append("No specific skill recommendations right now. Your roadmap is on track.")
    return "\n".join(lines)


def _salary_response(s: dict) -> str:
    sal = s.get("salary_range", {})
    low = sal.get("low", 0)
    high = sal.get("high", 0)
    growth = s.get("growth_potential", "moderate")
    return (
        f"**Salary Trajectory**\n\n"
        f"Estimated range: **${low:,}–${high:,}** annually.\n\n"
        f"Growth potential: **{growth}**. "
        f"Focus on high-premium skills (cloud, AI, infrastructure) to accelerate earnings."
    )


def _role_response(s: dict) -> str:
    path = s.get("dominant_path", "Unknown")
    adj = s.get("adjacent_roles", [])
    lines = [f"**Role Readiness**\n\nDominant path: **{path}**\n"]
    if adj:
        lines.append("Adjacent opportunities:")
        for a in adj[:3]:
            lines.append(f"• **{a['role']}** — {int(a['readiness']*100)}% ready (gap: {', '.join(a['gap_skills'])})")
    return "\n".join(lines)


def _project_response(s: dict, recs: list[dict]) -> str:
    path = s.get("dominant_path", "Unknown")
    focus = s.get("focus_areas", [])[:2]
    return (
        f"**Project Suggestions**\n\n"
        f"Based on your **{path}** trajectory and focus on {', '.join(focus) or 'your current skills'}:\n\n"
        f"• Build a deployment automation tool (strengthens infrastructure)\n"
        f"• Create a monitoring dashboard (reinforces observability)\n"
        f"• Contribute to an open-source project in your domain\n\n"
        f"Each project should demonstrate production-readiness and align with your specialization."
    )


def _market_response(s: dict) -> str:
    market = int(s.get("market_alignment", 0) * 100)
    growth = s.get("growth_potential", "moderate")
    return (
        f"**Market Intelligence**\n\n"
        f"Your market alignment is **{market}%** with **{growth}** growth potential.\n\n"
        f"Rising demand areas: Kubernetes, Terraform, LLM/AI, observability.\n"
        f"Focus on low-saturation, high-demand skills for maximum ROI."
    )


def _specialization_response(s: dict) -> str:
    specs = s.get("specializations", {})
    if not specs:
        return "No specialization data yet. Upload a resume and run an analysis to build your profile."
    lines = ["**Specialization Analysis**\n"]
    for domain, data in sorted(specs.items(), key=lambda x: x[1].get("strength", 0), reverse=True)[:4]:
        status = "dominant" if data.get("dominant") else "emerging" if data.get("emerging") else "developing"
        lines.append(f"• **{domain.title()}** — {int(data['strength']*100)}% strength ({status})")
    return "\n".join(lines)


def _recommendations_response(recs: list[dict]) -> str:
    if not recs:
        return "No active recommendations. Your profile needs more data — upload a resume and run an analysis."
    lines = ["**Strategic Recommendations**\n"]
    for r in recs[:5]:
        lines.append(f"• [{r['priority'].upper()}] **{r['title']}** — {r['explanation']}")
    return "\n".join(lines)


def _default_response(s: dict, recs: list[dict]) -> str:
    path = s.get("dominant_path", "your career")
    top_rec = recs[0]["title"] if recs else "building your skill profile"
    return (
        f"I'm your career intelligence copilot. I can help with:\n\n"
        f"• **Roadmap** — what to learn next\n"
        f"• **Roles** — readiness and adjacent opportunities\n"
        f"• **Market** — demand trends and salary insights\n"
        f"• **Projects** — portfolio suggestions\n"
        f"• **Strategy** — recommendations and priorities\n\n"
        f"Your current trajectory: **{path}**. Top priority: {top_rec}."
    )
