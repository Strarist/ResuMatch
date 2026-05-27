"""Semantic matching and scoring engine.

Produces recruiter-grade match scores by combining multiple signals:
- Skill semantic similarity (embeddings)
- Experience relevance (title/description alignment)
- Education fit
- Seniority alignment

Each signal produces a 0-1 score with an explanation.
Final score is a weighted combination with configurable weights.
"""

from dataclasses import dataclass, field

from app.ai.embeddings import embed_texts
from app.ai.similarity import compute_skill_similarity
import numpy as np


# === Scoring Weights ===
# These reflect recruiter priorities: skills matter most,
# then experience, then education.

WEIGHTS = {
    "skills": 0.50,
    "experience": 0.30,
    "education": 0.15,
    "seniority": 0.05,
}


@dataclass
class SignalScore:
    """A single scoring signal with explanation."""
    name: str
    score: float  # 0.0 - 1.0
    weight: float
    explanation: str
    details: dict = field(default_factory=dict)


@dataclass
class MatchResult:
    """Complete match evaluation result."""
    overall_score: float  # 0-100
    confidence: float  # 0-1 (how much data was available to score)
    signals: list[SignalScore]
    skill_matching: dict
    recommendations: list[dict]


async def score_match(
    resume_skills: list[str],
    job_skills: list[str],
    resume_experience: list[dict],
    job_experience: list[str],
    resume_education: list[dict],
    job_education: list[str],
    resume_titles: list[str] | None = None,
    job_title: str = "",
) -> MatchResult:
    """Compute a multi-signal match score.

    Returns an explainable MatchResult with per-signal breakdowns.
    """
    signals: list[SignalScore] = []
    data_points = 0
    total_possible = 4

    # === Signal 1: Skill Semantic Similarity ===
    skill_result = await compute_skill_similarity(resume_skills, job_skills)
    skill_score = skill_result["match_percentage"] / 100.0
    signals.append(SignalScore(
        name="skills",
        score=skill_score,
        weight=WEIGHTS["skills"],
        explanation=_skill_explanation(skill_result),
        details=skill_result,
    ))
    if resume_skills and job_skills:
        data_points += 1

    # === Signal 2: Experience Relevance ===
    exp_score = await _score_experience(resume_experience, job_experience, job_title)
    signals.append(SignalScore(
        name="experience",
        score=exp_score,
        weight=WEIGHTS["experience"],
        explanation=_experience_explanation(exp_score, resume_experience),
    ))
    if resume_experience:
        data_points += 1

    # === Signal 3: Education Fit ===
    edu_score = _score_education(resume_education, job_education)
    signals.append(SignalScore(
        name="education",
        score=edu_score,
        weight=WEIGHTS["education"],
        explanation=_education_explanation(edu_score),
    ))
    if resume_education:
        data_points += 1

    # === Signal 4: Seniority Alignment ===
    seniority_score = _score_seniority(resume_titles or [], job_title)
    signals.append(SignalScore(
        name="seniority",
        score=seniority_score,
        weight=WEIGHTS["seniority"],
        explanation=f"Seniority alignment: {int(seniority_score * 100)}%",
    ))
    if resume_titles:
        data_points += 1

    # === Weighted Combination ===
    overall = sum(s.score * s.weight for s in signals) * 100
    confidence = data_points / total_possible

    # Generate recommendations
    recommendations = _generate_recommendations(signals, skill_result)

    return MatchResult(
        overall_score=round(overall, 1),
        confidence=round(confidence, 2),
        signals=signals,
        skill_matching=skill_result,
        recommendations=recommendations,
    )


# === Signal Scoring Functions ===


async def _score_experience(resume_exp: list[dict], job_requirements: list[str], job_title: str) -> float:
    """Score experience relevance using semantic similarity of descriptions."""
    if not resume_exp or not job_title:
        return 0.5  # Neutral when data is missing

    # Compare resume job titles + descriptions against job title/requirements
    resume_texts = [
        f"{e.get('title', '')} {e.get('description', '')}" for e in resume_exp[:5]
    ]
    job_texts = [job_title] + (job_requirements or [])

    if not resume_texts or not job_texts:
        return 0.5

    resume_emb = await embed_texts(resume_texts)
    job_emb = await embed_texts(job_texts)

    # Max similarity between any resume experience and job requirements
    sim_matrix = job_emb @ resume_emb.T
    best_scores = sim_matrix.max(axis=1)  # Best resume match for each job requirement
    return float(np.clip(best_scores.mean(), 0, 1))


def _score_education(resume_edu: list[dict], job_edu: list[str]) -> float:
    """Score education fit."""
    if not resume_edu:
        return 0.5  # Neutral
    if not job_edu:
        return 0.8  # No requirements = most candidates qualify

    # Simple degree level matching
    degree_levels = {"phd": 4, "master": 3, "bachelor": 2, "associate": 1}
    resume_level = 0
    for edu in resume_edu:
        degree = edu.get("degree", "").lower()
        for key, level in degree_levels.items():
            if key in degree:
                resume_level = max(resume_level, level)

    required_level = 0
    for req in job_edu:
        req_lower = req.lower()
        for key, level in degree_levels.items():
            if key in req_lower:
                required_level = max(required_level, level)

    if required_level == 0:
        return 0.8
    if resume_level >= required_level:
        return 1.0
    if resume_level == required_level - 1:
        return 0.6
    return 0.3


def _score_seniority(resume_titles: list[str], job_title: str) -> float:
    """Score seniority alignment between resume history and target role."""
    if not resume_titles or not job_title:
        return 0.5

    seniority_keywords = {
        "intern": 0, "junior": 1, "associate": 1,
        "mid": 2, "senior": 3, "lead": 4,
        "staff": 4, "principal": 5, "director": 5, "vp": 6,
    }

    def _extract_level(title: str) -> int:
        title_lower = title.lower()
        for keyword, level in seniority_keywords.items():
            if keyword in title_lower:
                return level
        return 2  # Default to mid-level

    resume_level = max(_extract_level(t) for t in resume_titles)
    job_level = _extract_level(job_title)

    diff = abs(resume_level - job_level)
    if diff == 0:
        return 1.0
    if diff == 1:
        return 0.7
    return max(0.3, 1.0 - diff * 0.2)


# === Explanation Generators ===


def _skill_explanation(result: dict) -> str:
    matched = len(result.get("matched_skills", []))
    total = matched + len(result.get("missing_skills", []))
    if total == 0:
        return "No skill requirements specified"
    pct = result.get("match_percentage", 0)
    return f"{matched}/{total} required skills matched ({pct:.0f}%)"


def _experience_explanation(score: float, experience: list[dict]) -> str:
    years = len(experience)
    if score >= 0.7:
        return f"Strong experience alignment ({years} roles, high relevance)"
    if score >= 0.5:
        return f"Moderate experience alignment ({years} roles)"
    return f"Limited relevant experience found ({years} roles)"


def _education_explanation(score: float) -> str:
    if score >= 0.9:
        return "Education meets or exceeds requirements"
    if score >= 0.6:
        return "Education is close to requirements"
    return "Education gap identified"


# === Recommendation Engine ===


def _generate_recommendations(signals: list[SignalScore], skill_result: dict) -> list[dict]:
    """Generate prioritized, actionable recommendations."""
    recs: list[dict] = []

    # Missing skills (highest priority)
    missing = skill_result.get("missing_skills", [])
    if missing:
        # Prioritize by how many job skills are missing
        priority = "high" if len(missing) > 3 else "medium"
        recs.append({
            "type": "skill_gap",
            "priority": priority,
            "title": "Develop Missing Skills",
            "description": f"Focus on: {', '.join(missing[:5])}",
            "skills": missing[:5],
            "impact": f"Would improve match by ~{min(len(missing) * 8, 30)}%",
        })

    # Experience signal
    exp_signal = next((s for s in signals if s.name == "experience"), None)
    if exp_signal and exp_signal.score < 0.5:
        recs.append({
            "type": "experience",
            "priority": "medium",
            "title": "Strengthen Relevant Experience",
            "description": "Highlight projects or roles that demonstrate required competencies",
            "impact": "Could improve experience score significantly",
        })

    # Education signal
    edu_signal = next((s for s in signals if s.name == "education"), None)
    if edu_signal and edu_signal.score < 0.6:
        recs.append({
            "type": "education",
            "priority": "low",
            "title": "Consider Additional Credentials",
            "description": "Relevant certifications or coursework may strengthen your application",
            "impact": "Minor improvement to overall match",
        })

    # Overall optimization
    overall = sum(s.score * s.weight for s in signals) * 100
    if overall < 50:
        recs.append({
            "type": "resume_optimization",
            "priority": "high",
            "title": "Resume Restructuring Recommended",
            "description": "Consider tailoring your resume to emphasize relevant skills and experience for this role",
            "impact": "Significant improvement possible with targeted resume edits",
        })

    return recs
