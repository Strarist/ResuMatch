"""Analysis service — orchestrates the AI matching pipeline."""

import os
from uuid import UUID

from app.config import get_settings
from app.exceptions import NotFoundError
from app.models.resume import Resume
from app.repositories.resume_repo import ResumeRepository
from app.ai.resume_parser import parse_resume_ai, ParsedResume
from app.ai.scoring import score_match, MatchResult
from app.ai.text_extraction import extract_text_from_pdf


class AnalysisService:
    def __init__(self, resume_repo: ResumeRepository):
        self.resume_repo = resume_repo
        self._settings = get_settings()

    async def analyze(self, *, resume_id: UUID, job_description: str, user_id: UUID) -> dict:
        """Run full analysis: parse resume + parse job + score match."""
        resume = await self._get_resume(resume_id, user_id)
        file_path = self._resume_path(resume)

        # Get or compute parsed resume data
        parsed = await self._get_parsed_resume(resume, file_path)

        # Parse job description with AI
        from app.ai import AIMessage
        from app.ai.provider_factory import get_ai_provider
        from app.ai.prompts import JOB_MATCH_SYSTEM, JOB_MATCH_USER

        # Extract job requirements via AI
        provider = get_ai_provider()
        job_text = job_description[:10000]
        job_data = await provider.generate_json([
            AIMessage(role="system", content="Extract job requirements as JSON: {\"skills\": [...], \"education\": [...], \"experience\": [...], \"title\": \"...\"}"),
            AIMessage(role="user", content=f"Extract requirements from:\n\n{job_text}"),
        ], temperature=0.1)

        # Score the match
        result = await score_match(
            resume_skills=parsed.skills,
            job_skills=job_data.get("skills", []),
            resume_experience=[e.model_dump() for e in parsed.experience],
            job_experience=job_data.get("experience", []),
            resume_education=[e.model_dump() for e in parsed.education],
            job_education=job_data.get("education", []),
            resume_titles=[e.title for e in parsed.experience],
            job_title=job_data.get("title", ""),
        )

        return self._format_result(resume, result, parsed, job_data)

    async def analyze_batch(self, *, resume_id: UUID, job_descriptions: list[str], user_id: UUID) -> dict:
        """Run analysis against multiple job descriptions."""
        results = []
        for i, jd in enumerate(job_descriptions):
            try:
                r = await self.analyze(resume_id=resume_id, job_description=jd, user_id=user_id)
                results.append({"job_index": i, "overall_score": r["overall_match_score"], **r["detailed_scores"]})
            except Exception:
                results.append({"job_index": i, "error": "Analysis failed"})

        results.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
        return {"resume_id": str(resume_id), "total_jobs_analyzed": len(job_descriptions), "results": results}

    async def _get_resume(self, resume_id: UUID, user_id: UUID) -> Resume:
        resume = await self.resume_repo.get_by_id(resume_id, user_id)
        if not resume:
            raise NotFoundError("Resume not found")
        if not os.path.exists(self._resume_path(resume)):
            raise NotFoundError("Resume file not found")
        return resume

    async def _get_parsed_resume(self, resume: Resume, file_path: str) -> ParsedResume:
        """Return cached parsed data or parse fresh."""
        if resume.parsed_data and resume.parse_status == "completed":
            return ParsedResume.model_validate(resume.parsed_data)
        # Parse fresh
        parsed = await parse_resume_ai(file_path)
        from app.ai.skill_normalization import normalize_skills
        parsed.skills = normalize_skills(parsed.skills)
        # Cache in DB
        resume.parsed_data = parsed.model_dump()
        resume.skills = parsed.skills
        resume.parse_status = "completed"
        await self.resume_repo.db.commit()
        return parsed

    def _resume_path(self, resume: Resume) -> str:
        return os.path.join(self._settings.upload_dir, f"{resume.id}_{resume.filename}")

    @staticmethod
    def _format_result(resume: Resume, result: MatchResult, parsed: ParsedResume, job_data: dict) -> dict:
        return {
            "resume_id": str(resume.id),
            "resume_filename": resume.filename,
            "overall_match_score": result.overall_score,
            "confidence": result.confidence,
            "detailed_scores": {
                "skills_score": round(result.signals[0].score * 100, 1),
                "experience_score": round(result.signals[1].score * 100, 1),
                "education_score": round(result.signals[2].score * 100, 1),
                "seniority_score": round(result.signals[3].score * 100, 1),
            },
            "explanations": {s.name: s.explanation for s in result.signals},
            "skill_matching": result.skill_matching,
            "resume_analysis": {
                "extracted_skills": parsed.skills,
                "education": [e.model_dump() for e in parsed.education],
                "experience": [e.model_dump() for e in parsed.experience],
            },
            "job_analysis": job_data,
            "recommendations": result.recommendations,
        }
