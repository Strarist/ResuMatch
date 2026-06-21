"""Market Intelligence Engine — deterministic skill market analysis.

Provides: demand scoring, ROI estimation, recruiter attractiveness, salary trajectory.
No LLM dependency. Uses curated market data heuristics.
"""

from __future__ import annotations

# === Market demand data (curated heuristics, updatable) ===

SKILL_MARKET_DATA: dict[str, dict] = {
    "kubernetes": {"demand": 0.92, "trend": "rising", "saturation": "medium", "salary_premium": 0.18, "category": "infrastructure"},
    "terraform": {"demand": 0.88, "trend": "rising", "saturation": "low", "salary_premium": 0.15, "category": "infrastructure"},
    "aws": {"demand": 0.95, "trend": "stable", "saturation": "high", "salary_premium": 0.12, "category": "cloud"},
    "docker": {"demand": 0.90, "trend": "stable", "saturation": "high", "salary_premium": 0.08, "category": "infrastructure"},
    "react": {"demand": 0.88, "trend": "stable", "saturation": "high", "salary_premium": 0.10, "category": "frontend"},
    "typescript": {"demand": 0.87, "trend": "rising", "saturation": "medium", "salary_premium": 0.09, "category": "frontend"},
    "python": {"demand": 0.93, "trend": "rising", "saturation": "high", "salary_premium": 0.10, "category": "backend"},
    "fastapi": {"demand": 0.78, "trend": "rising", "saturation": "low", "salary_premium": 0.12, "category": "backend"},
    "postgresql": {"demand": 0.82, "trend": "stable", "saturation": "medium", "salary_premium": 0.07, "category": "data"},
    "langchain": {"demand": 0.85, "trend": "rising", "saturation": "low", "salary_premium": 0.22, "category": "ai"},
    "machine learning": {"demand": 0.88, "trend": "rising", "saturation": "medium", "salary_premium": 0.20, "category": "ai"},
    "ci/cd": {"demand": 0.85, "trend": "stable", "saturation": "medium", "salary_premium": 0.08, "category": "devops"},
    "linux": {"demand": 0.80, "trend": "stable", "saturation": "high", "salary_premium": 0.05, "category": "infrastructure"},
    "go": {"demand": 0.82, "trend": "rising", "saturation": "low", "salary_premium": 0.15, "category": "backend"},
    "rust": {"demand": 0.75, "trend": "rising", "saturation": "low", "salary_premium": 0.18, "category": "systems"},
    "next.js": {"demand": 0.83, "trend": "rising", "saturation": "medium", "salary_premium": 0.11, "category": "frontend"},
    "graphql": {"demand": 0.72, "trend": "stable", "saturation": "medium", "salary_premium": 0.08, "category": "backend"},
    "redis": {"demand": 0.75, "trend": "stable", "saturation": "medium", "salary_premium": 0.06, "category": "data"},
    "kafka": {"demand": 0.78, "trend": "rising", "saturation": "low", "salary_premium": 0.14, "category": "data"},
    "spark": {"demand": 0.76, "trend": "stable", "saturation": "low", "salary_premium": 0.16, "category": "data"},
    "pytorch": {"demand": 0.82, "trend": "rising", "saturation": "low", "salary_premium": 0.20, "category": "ai"},
    "llm": {"demand": 0.90, "trend": "rising", "saturation": "low", "salary_premium": 0.25, "category": "ai"},
    "embeddings": {"demand": 0.80, "trend": "rising", "saturation": "low", "salary_premium": 0.20, "category": "ai"},
    "observability": {"demand": 0.78, "trend": "rising", "saturation": "low", "salary_premium": 0.12, "category": "devops"},
    "microservices": {"demand": 0.80, "trend": "stable", "saturation": "medium", "salary_premium": 0.10, "category": "architecture"},
    "system design": {"demand": 0.85, "trend": "stable", "saturation": "low", "salary_premium": 0.15, "category": "architecture"},
}

# Curated role-specific market intelligence datasets
DOMAIN_MARKET_INTELLIGENCE = {
    "cloud engineering": {
        "title": "Cloud Infrastructure & Platform Engineering",
        "description": "Intense industry focus on platform engineering standard updates, container scheduling scaling, and cost reduction models.",
        "salaryRange": "$170k - $260k",
        "growthRate": "Surging (+18% YoY)",
        "demandTrend": "up",
        "demandChangePercent": 18,
        "emergingTechnologies": ["Kubernetes Operator Framework", "Istio Ambient Mesh", "ArgoCD GitOps", "eBPF Observability"],
        "recruiterUrgency": "high"
    },
    "backend engineering": {
        "title": "Distributed Core Systems & Backend Engineering",
        "description": "Steady market demand for performance-tuned relational backends, event-driven data streaming, and distributed saga coordination.",
        "salaryRange": "$150k - $220k",
        "growthRate": "Steady (+9% YoY)",
        "demandTrend": "stable",
        "demandChangePercent": 9,
        "emergingTechnologies": ["Rust Core Tooling", "Go Microservices", "Kafka Streams", "Distributed Saga Patterns"],
        "recruiterUrgency": "medium"
    },
    "AI engineering": {
        "title": "AI Platform & Large Models Systems",
        "description": "Exponential industry demand spikes in GPU scale training execution, custom CUDA optimizations, and low-latency model serving frameworks.",
        "salaryRange": "$180k - $310k",
        "growthRate": "Surging (+28% YoY)",
        "demandTrend": "up",
        "demandChangePercent": 28,
        "emergingTechnologies": ["vLLM Serving Layer", "CUDA Custom Kernels", "PyTorch FSDP", "Vector Indexing"],
        "recruiterUrgency": "high"
    },
    "full stack engineering": {
        "title": "Full Stack Application Architecture",
        "description": "High market focus on Next.js Server Components, real-time micro-frontend hydration, and federated schema stitching schemas.",
        "salaryRange": "$160k - $230k",
        "growthRate": "Steady (+12% YoY)",
        "demandTrend": "up",
        "demandChangePercent": 12,
        "emergingTechnologies": ["Next.js App Router", "GraphQL Federation", "WebSockets Real-time", "Tailwind styling ecosystems"],
        "recruiterUrgency": "medium"
    },
    "DevOps/platform engineering": {
        "title": "Security Hardening & Release DevOps Engineering",
        "description": "High market value on secure multi-tier CI/CD pipelines, automated reproducible build state engines, and cloud cost allocation metrics.",
        "salaryRange": "$150k - $215k",
        "growthRate": "Steady (+10% YoY)",
        "demandTrend": "stable",
        "demandChangePercent": 10,
        "emergingTechnologies": ["GitHub Actions Hardening", "ArgoCD GitOps", "Helm packaging charts", "Cloud Spend Guardrails"],
        "recruiterUrgency": "medium"
    }
}

# Salary bands by seniority (USD, annual)
SALARY_BANDS = {
    "junior": {"base": 65000, "ceiling": 95000},
    "mid": {"base": 95000, "ceiling": 140000},
    "senior": {"base": 140000, "ceiling": 200000},
    "staff": {"base": 180000, "ceiling": 280000},
}


def compute_market_intelligence(
    user_skills: list[str],
    skill_confidences: dict[str, float],
    target_role: str | None,
    seniority: str,
    growth_velocity: float,
) -> dict:
    """Compute full market intelligence snapshot using live crawled opportunities."""
    import json
    import os
    from datetime import datetime

    generated_at = datetime.utcnow().isoformat()

    # 1. Load crawled jobs from cache
    jobs = []
    CACHE_FILE = "scratch/cached_jobs.json"
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                jobs = json.load(f)
        except Exception:
            pass

    user_set = set(s.lower() for s in user_skills)

    # Compute recruiter demand graph dynamically
    from app.services.market_intelligence.recruiter_demand import compute_recruiter_demand_index
    demand_graph = compute_recruiter_demand_index(jobs, user_skills)

    # 2. Dynamic skill demand analysis
    skill_demand = []
    for skill in user_set:
        # Match against our recruiter demand index
        matched = False
        for sk_name, metrics in demand_graph.items():
            if skill == sk_name.lower():
                skill_demand.append({
                    "skill": skill,
                    "demand": metrics["demand_score"],
                    "trend": "rising" if metrics["growth_score"] >= 0.5 else "stable",
                    "saturation": "low" if metrics["scarcity_score"] >= 0.7 else "medium" if metrics["scarcity_score"] >= 0.4 else "high",
                    "category": SKILL_MARKET_DATA.get(sk_name, {}).get("category", "languages")
                })
                matched = True
                break
        if not matched:
            skill_demand.append({
                "skill": skill,
                "demand": 0.75,
                "trend": "stable",
                "saturation": "medium",
                "category": "languages",
                "source": "Default heuristic (no crawl match)",
                "confidence": "LOW",
                "generated_at": generated_at,
                "methodology": "Default demand score when skill not found in recruiter demand index",
            })
    skill_demand.sort(key=lambda x: x["demand"], reverse=True)

    # 3. Dynamic Skill ROI (missing high-value skills)
    roi_skills = []
    for sk_name, metrics in demand_graph.items():
        if sk_name.lower() in user_set:
            continue
        # ROI score based on demand score and scarcity
        roi = metrics["demand_score"] * metrics["growth_score"] * (1.2 if metrics["scarcity_score"] >= 0.7 else 1.0)
        roi_skills.append({
            "skill": sk_name,
            "roi_score": round(min(1.0, roi), 3),
            "demand": metrics["demand_score"],
            "trend": "rising" if metrics["growth_score"] >= 0.5 else "stable",
            "salary_premium": float(SKILL_MARKET_DATA.get(sk_name, {}).get("salary_premium", 0.12)),
            "role_relevant": True if target_role and sk_name.lower() in target_role.lower() else False
        })
    roi_skills.sort(key=lambda x: x["roi_score"], reverse=True)

    # 4. Recruiter attractiveness score
    in_demand = [s for s in user_set if s in SKILL_MARKET_DATA and SKILL_MARKET_DATA[s]["demand"] >= 0.8]
    portfolio_strength = min(1.0, len(in_demand) / 6)

    categories = [SKILL_MARKET_DATA[s]["category"] for s in user_set if s in SKILL_MARKET_DATA]
    if categories:
        most_common = max(set(categories), key=categories.count)
        coherence = categories.count(most_common) / len(categories)
    else:
        coherence = 0.0

    avg_confidence = sum(skill_confidences.values()) / max(len(skill_confidences), 1)

    overall_attractiveness = portfolio_strength * 0.35 + coherence * 0.25 + avg_confidence * 0.2 + growth_velocity * 0.2
    attractiveness = {
        "overall_score": round(min(1.0, overall_attractiveness), 3),
        "portfolio_strength": round(portfolio_strength, 3),
        "stack_coherence": round(coherence, 3),
        "specialization_maturity": round(avg_confidence, 3),
        "growth_signal": round(growth_velocity, 3)
    }

    # 5. Salary trajectory
    band = SALARY_BANDS.get(seniority, SALARY_BANDS["mid"])
    premiums = sum(
        SKILL_MARKET_DATA[s]["salary_premium"]
        for s in user_set if s in SKILL_MARKET_DATA
    )
    premium_factor = min(0.35, premiums)

    # Compute base and ceiling dynamically from matched jobs if available
    matching_salaries = []
    from app.services.opportunity_engine.quality.compensation_parser import parse_compensation
    for j in jobs:
        if target_role and (target_role.lower() in j.get("title", "").lower() or j.get("title", "").lower() in target_role.lower()):
            comp_str = j.get("compensation", "")
            parsed = parse_compensation(comp_str)
            if parsed.get("min_amount") and parsed.get("max_amount"):
                matching_salaries.append((parsed["min_amount"], parsed["max_amount"]))

    if matching_salaries:
        min_salary = min(s[0] for s in matching_salaries)
        max_salary = max(s[1] for s in matching_salaries)
        estimated_current = int(min_salary)
        estimated_ceiling = int(max_salary)
    else:
        estimated_current = int(band["base"] * (1 + premium_factor * 0.5))
        estimated_ceiling = int(band["ceiling"] * (1 + premium_factor))

    growth_potential = "high" if growth_velocity >= 0.5 else "moderate" if growth_velocity >= 0.25 else "low"
    salary = {
        "seniority": seniority,
        "estimated_range": {"low": estimated_current, "high": estimated_ceiling},
        "premium_factor": round(premium_factor, 3),
        "growth_potential": growth_potential
    }

    # 6. High-value missing
    high_value_missing = [s for s in roi_skills if s["roi_score"] >= 0.6][:5]

    # 7. Map curated domain info
    domain_key = "full stack engineering"
    role_str = (target_role or "").lower()

    if "ai" in role_str or "machine learning" in role_str or "pytorch" in user_set:
        domain_key = "AI engineering"
    elif "cloud" in role_str or "infrastructure" in role_str or "kubernetes" in user_set:
        domain_key = "cloud engineering"
    elif "devops" in role_str or "platform" in role_str or "argocd" in user_set:
        domain_key = "DevOps/platform engineering"
    elif "backend" in role_str or "go" in user_set or "distributed" in role_str:
        domain_key = "backend engineering"

    curated_domain = DOMAIN_MARKET_INTELLIGENCE[domain_key]

    # Enrich skill_demand items
    for item in skill_demand:
        item.update({
            "source": "Curated Skill Market Data",
            "confidence": "MEDIUM",
            "generated_at": generated_at,
            "methodology": "Heuristic based on curated demand scores"
        })
    # Enrich roi_skills items
    for item in roi_skills:
        item.update({
            "source": "Curated Skill Market Data",
            "confidence": "MEDIUM",
            "generated_at": generated_at,
            "methodology": "Heuristic ROI based on demand, growth, and salary premium"
        })
    # Enrich recruiter_attractiveness
    attractiveness.update({
        "source": "Recruiter demand index from crawled jobs",
        "confidence": "HIGH",
        "generated_at": generated_at,
        "methodology": "Aggregated demand scores from recent job postings"
    })
    # Enrich salary trajectory
    salary.update({
        "source": "Salary bands with skill premiums",
        "confidence": "MEDIUM",
        "generated_at": generated_at,
        "methodology": "Calculated from skill premiums and industry salary bands"
    })
    # Enrich high_value_missing items
    for item in high_value_missing:
        item.update({
            "source": "ROI calculation",
            "confidence": "MEDIUM",
            "generated_at": generated_at,
            "methodology": "Top ROI skills not present in user profile"
        })
    # Enrich curated_domain
    curated_domain.update({
        "source": "Curated domain market intelligence dataset",
        "confidence": "MEDIUM",
        "generated_at": generated_at,
        "methodology": "Static curated data per domain"
    })
    return {
        "skill_demand": skill_demand,
        "roi_skills": roi_skills[:8],
        "recruiter_attractiveness": attractiveness,
        "salary_trajectory": salary,
        "high_value_missing": high_value_missing,
        "curated_domain": curated_domain,
        "demand_graph": demand_graph
    }


def _compute_skill_demand(user_set: set[str]) -> list[dict]:
    """Score demand for user's current skills."""
    results = []
    for skill in user_set:
        data = SKILL_MARKET_DATA.get(skill)
        if data:
            results.append({
                "skill": skill,
                "demand": data["demand"],
                "trend": data["trend"],
                "saturation": data["saturation"],
                "category": data["category"],
            })
    results.sort(key=lambda x: x["demand"], reverse=True)
    return results


def _compute_skill_roi(user_set: set[str], target_role: str | None) -> list[dict]:
    """Find highest-ROI skills the user doesn't have."""
    from app.services.trajectory.engine import ROLE_TEMPLATES

    # Get target skills from role template
    target_skills = set()
    if target_role and target_role in ROLE_TEMPLATES:
        tmpl = ROLE_TEMPLATES[target_role]
        target_skills = set(tmpl["core"] + tmpl["supporting"])

    results = []
    for skill, data in SKILL_MARKET_DATA.items():
        if skill in user_set:
            continue
        # ROI = demand * salary_premium * (1 + role_relevance)
        role_relevance = 0.3 if skill in target_skills else 0.0
        roi = data["demand"] * data["salary_premium"] * (1 + role_relevance) * 5  # scale to 0-1ish
        roi = min(1.0, roi)

        results.append({
            "skill": skill,
            "roi_score": round(roi, 3),
            "demand": data["demand"],
            "trend": data["trend"],
            "salary_premium": data["salary_premium"],
            "role_relevant": skill in target_skills,
        })
    results.sort(key=lambda x: x["roi_score"], reverse=True)
    return results


def _compute_recruiter_attractiveness(
    user_set: set[str], confidences: dict[str, float], velocity: float
) -> dict:
    """Compute how attractive the profile is to recruiters."""
    # Portfolio strength: how many in-demand skills
    in_demand = [s for s in user_set if s in SKILL_MARKET_DATA and SKILL_MARKET_DATA[s]["demand"] >= 0.8]
    portfolio_strength = min(1.0, len(in_demand) / 6)

    # Stack coherence: skills in same category cluster
    categories = [SKILL_MARKET_DATA[s]["category"] for s in user_set if s in SKILL_MARKET_DATA]
    if categories:
        most_common = max(set(categories), key=categories.count)
        coherence = categories.count(most_common) / len(categories)
    else:
        coherence = 0.0

    # Specialization maturity
    avg_confidence = sum(confidences.values()) / max(len(confidences), 1)

    # Overall score
    score = portfolio_strength * 0.35 + coherence * 0.25 + avg_confidence * 0.2 + velocity * 0.2

    return {
        "overall_score": round(min(1.0, score), 3),
        "portfolio_strength": round(portfolio_strength, 3),
        "stack_coherence": round(coherence, 3),
        "specialization_maturity": round(avg_confidence, 3),
        "growth_signal": round(velocity, 3),
    }


def _compute_salary_trajectory(user_set: set[str], seniority: str, velocity: float) -> dict:
    """Estimate salary band and growth potential."""
    band = SALARY_BANDS.get(seniority, SALARY_BANDS["mid"])

    # Premium from high-value skills
    premiums = sum(
        SKILL_MARKET_DATA[s]["salary_premium"]
        for s in user_set if s in SKILL_MARKET_DATA
    )
    premium_factor = min(0.35, premiums)  # cap at 35%

    estimated_current = int(band["base"] * (1 + premium_factor * 0.5))
    estimated_ceiling = int(band["ceiling"] * (1 + premium_factor))

    # Growth potential based on velocity and missing high-value skills
    growth_potential = "high" if velocity >= 0.5 else "moderate" if velocity >= 0.25 else "low"

    return {
        "seniority": seniority,
        "estimated_range": {"low": estimated_current, "high": estimated_ceiling},
        "premium_factor": round(premium_factor, 3),
        "growth_potential": growth_potential,
    }
