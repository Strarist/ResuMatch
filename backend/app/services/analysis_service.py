"""Analysis service — orchestrates the AI matching pipeline."""

import os

from app.config import get_settings
from app.exceptions import NotFoundError, ExternalServiceError
from app.models import Resume
from app.repositories.resume_repo import ResumeRepository
from app.utils.resume_parser import resume_parser
from app.utils.job_parser import parse_job_description
from app.utils.skills_matcher import skills_matcher


class AnalysisService:
    def __init__(self, resume_repo: ResumeRepository):
        self.resume_repo = resume_repo
        self._settings = get_settings()

    async def analyze(self, *, resume_id: str, job_description: str, user_id: int) -> dict:
        """Run full analysis pipeline for a single job description."""
        resume = await self._get_resume_with_file(resume_id, user_id)
        file_path = self._resume_path(resume)

        resume_analysis = resume_parser.parse_resume(file_path)
        job_analysis = parse_job_description(job_description)
        scores = skills_matcher.calculate_overall_match_score(resume_analysis, job_analysis)
        detailed = skills_matcher.get_detailed_matching(
            resume_analysis.get("skills", []), job_analysis.get("skills", [])
        )

        if not resume.skills:
            await self.resume_repo.update_skills(resume, resume_analysis.get("skills", []))

        return {
            "resume_id": resume_id,
            "resume_filename": resume.filename,
            "overall_match_score": scores["overall_score"],
            "detailed_scores": {
                "skills_score": scores["skills_score"],
                "experience_score": scores["experience_score"],
                "education_score": scores["education_score"],
            },
            "resume_analysis": {
                "extracted_skills": resume_analysis.get("skills", []),
                "education": resume_analysis.get("education", []),
                "experience": resume_analysis.get("experience", []),
            },
            "job_analysis": {
                "required_skills": job_analysis.get("skills", []),
                "required_education": job_analysis.get("education", []),
                "required_experience": job_analysis.get("experience", []),
            },
            "skill_matching": {
                "skill_matches": detailed.get("skill_matches", []),
                "missing_skills": detailed.get("missing_skills", []),
                "extra_skills": detailed.get("extra_skills", []),
                "match_percentage": detailed.get("match_percentage", 0.0),
            },
            "recommendations": self._recommendations(detailed, scores),
        }

    async def analyze_batch(self, *, resume_id: str, job_descriptions: list[str],
                            user_id: int) -> dict:
        """Run analysis against multiple job descriptions."""
        resume = await self._get_resume_with_file(resume_id, user_id)
        file_path = self._resume_path(resume)
        resume_analysis = resume_parser.parse_resume(file_path)

        results = []
        for i, jd in enumerate(job_descriptions):
            try:
                job_analysis = parse_job_description(jd)
                scores = skills_matcher.calculate_overall_match_score(resume_analysis, job_analysis)
                results.append({
                    "job_index": i,
                    "overall_score": scores["overall_score"],
                    "skills_score": scores["skills_score"],
                    "experience_score": scores["experience_score"],
                    "education_score": scores["education_score"],
                    "required_skills": job_analysis.get("skills", []),
                })
            except Exception:
                results.append({"job_index": i, "error": "Analysis failed"})

        results.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
        return {"resume_id": resume_id, "total_jobs_analyzed": len(job_descriptions), "results": results}

    async def _get_resume_with_file(self, resume_id: str, user_id: int) -> Resume:
        resume = await self.resume_repo.get_by_id(resume_id, user_id)
        if not resume:
            raise NotFoundError("Resume not found")
        if not os.path.exists(self._resume_path(resume)):
            raise NotFoundError("Resume file not found")
        return resume

    def _resume_path(self, resume: Resume) -> str:
        return os.path.join(self._settings.upload_dir, f"{resume.id}_{resume.filename}")

    @staticmethod
    def _recommendations(detailed: dict, scores: dict) -> list[dict]:
        recs = []
        missing = detailed.get("missing_skills", [])
        if missing:
            recs.append({
                "type": "skill_gap", "title": "Skills to Develop",
                "description": f"Consider learning: {', '.join(missing[:5])}",
                "priority": "high" if len(missing) > 3 else "medium",
            })
        if scores["experience_score"] < 0.7:
            recs.append({
                "type": "experience", "title": "Experience Enhancement",
                "description": "Highlight more relevant work experience",
                "priority": "medium",
            })
        if scores["overall_score"] < 0.6:
            recs.append({
                "type": "resume_optimization", "title": "Resume Optimization",
                "description": "Restructure resume to highlight relevant skills",
                "priority": "high",
            })
        return recs
