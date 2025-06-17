from typing import List, Dict, Optional, Tuple
from datetime import datetime
import spacy
from sentence_transformers import SentenceTransformer
from app.models.resume import Resume
from app.models.job import JobPost
from app.schemas.compatibility import (
    CompatibilityReport, SkillMatch, RoleMatch, ExperienceMatch,
    MatchCategory
)
from app.services.resume_matcher import ResumeMatcher

class CompatibilityAnalyzer:
    def __init__(self):
        self.matcher = ResumeMatcher()
        self.nlp = spacy.load("en_core_web_lg")
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Predefined skill categories
        self.skill_categories = {
            'technical': ['programming', 'software', 'database', 'cloud', 'devops'],
            'soft': ['communication', 'leadership', 'teamwork', 'problem-solving'],
            'domain': ['finance', 'healthcare', 'education', 'retail'],
            'tools': ['git', 'docker', 'aws', 'azure', 'jira']
        }

    def _get_match_category(self, score: float) -> MatchCategory:
        """Convert score to match category."""
        if score >= 0.8:
            return MatchCategory.EXCELLENT
        elif score >= 0.6:
            return MatchCategory.GOOD
        elif score >= 0.4:
            return MatchCategory.FAIR
        return MatchCategory.POOR

    def _categorize_skill(self, skill: str) -> str:
        """Categorize a skill into predefined categories."""
        skill_lower = skill.lower()
        for category, keywords in self.skill_categories.items():
            if any(keyword in skill_lower for keyword in keywords):
                return category
        return 'other'

    def _generate_skill_suggestions(self, skill: str, category: str) -> List[str]:
        """Generate improvement suggestions for a skill."""
        suggestions = []
        if category == 'technical':
            suggestions.extend([
                f"Add specific projects using {skill}",
                f"Highlight {skill} certifications if any",
                f"Quantify experience with {skill}"
            ])
        elif category == 'soft':
            suggestions.extend([
                f"Add examples of {skill} in action",
                f"Include {skill} in your summary",
                f"Highlight {skill} in achievement bullets"
            ])
        return suggestions

    async def analyze_skills(
        self,
        resume_skills: List[str],
        job_skills: List[str]
    ) -> Tuple[List[SkillMatch], float]:
        """Analyze skill compatibility between resume and job."""
        skill_matches = []
        total_score = 0.0
        
        # Get semantic similarity matrix
        resume_embeddings = self.embedder.encode(resume_skills, convert_to_tensor=True)
        job_embeddings = self.embedder.encode(job_skills, convert_to_tensor=True)
        
        for i, resume_skill in enumerate(resume_skills):
            # Calculate semantic similarity with all job skills
            semantic_scores = []
            for job_skill in job_skills:
                similarity = self.matcher.calculate_semantic_similarity(
                    resume_skill, job_skill
                )
                semantic_scores.append(similarity)
            
            # Get best match
            max_semantic_score = max(semantic_scores) if semantic_scores else 0
            
            # Calculate keyword match
            keyword_score = 1.0 if resume_skill.lower() in [
                s.lower() for s in job_skills
            ] else 0.0
            
            # Calculate overall score (70% semantic, 30% keyword)
            overall_score = (max_semantic_score * 0.7 + keyword_score * 0.3)
            total_score += overall_score
            
            # Categorize skill
            category = self._categorize_skill(resume_skill)
            
            # Generate suggestions if score is low
            suggestions = None
            if overall_score < 0.6:
                suggestions = self._generate_skill_suggestions(resume_skill, category)
            
            skill_matches.append(SkillMatch(
                name=resume_skill,
                score=overall_score,
                category=category,
                semantic_score=max_semantic_score,
                keyword_score=keyword_score,
                is_matched=overall_score >= 0.6,
                suggestions=suggestions
            ))
        
        # Add missing skills from job
        for job_skill in job_skills:
            if not any(sm.name.lower() == job_skill.lower() for sm in skill_matches):
                category = self._categorize_skill(job_skill)
                suggestions = self._generate_skill_suggestions(job_skill, category)
                skill_matches.append(SkillMatch(
                    name=job_skill,
                    score=0.0,
                    category=category,
                    is_matched=False,
                    suggestions=suggestions
                ))
        
        average_score = total_score / len(resume_skills) if resume_skills else 0
        return skill_matches, average_score

    async def analyze_role(
        self,
        resume_role: Optional[str],
        job_title: str,
        job_category: str
    ) -> RoleMatch:
        """Analyze role compatibility."""
        if not resume_role:
            return RoleMatch(
                title_similarity=0.0,
                category_match=0.0,
                overall_score=0.0,
                category=MatchCategory.POOR
            )
        
        # Calculate title similarity
        title_similarity = self.matcher.calculate_semantic_similarity(
            resume_role, job_title
        )
        
        # Calculate category match
        category_match = self.matcher.calculate_semantic_similarity(
            resume_role, job_category
        )
        
        # Calculate overall score
        overall_score = (title_similarity * 0.7 + category_match * 0.3)
        
        return RoleMatch(
            title_similarity=title_similarity,
            category_match=category_match,
            overall_score=overall_score,
            category=self._get_match_category(overall_score)
        )

    async def analyze_experience(
        self,
        resume: Resume,
        job: JobPost
    ) -> ExperienceMatch:
        """Analyze experience compatibility."""
        # Calculate years match
        required_years = job.required_experience_years
        actual_years = resume.total_experience_years
        years_match = min(actual_years / required_years, 1.0) if required_years > 0 else 1.0
        
        # Calculate role relevance
        role_relevance = self.matcher.calculate_semantic_similarity(
            resume.role_description or "",
            job.description
        )
        
        # Calculate overall score
        overall_score = (years_match * 0.6 + role_relevance * 0.4)
        
        # Generate gaps if any
        gaps = []
        if years_match < 0.8:
            gaps.append(f"Consider highlighting {required_years - actual_years:.1f} more years of relevant experience")
        if role_relevance < 0.6:
            gaps.append("Add more details about your current role's responsibilities")
        
        return ExperienceMatch(
            years_match=years_match,
            role_relevance=role_relevance,
            required_years=required_years,
            actual_years=actual_years,
            overall_score=overall_score,
            category=self._get_match_category(overall_score),
            gaps=gaps
        )

    async def generate_report(
        self,
        resume: Resume,
        job: JobPost
    ) -> CompatibilityReport:
        """Generate comprehensive compatibility report."""
        # Extract skills
        resume_skills = await self.matcher.extract_skills(resume.content)
        job_skills = await self.matcher.extract_skills(job.description)
        
        # Analyze skills
        skill_matches, average_skill_score = await self.analyze_skills(
            resume_skills, job_skills
        )
        
        # Analyze role
        role_match = await self.analyze_role(
            resume.role_description,
            job.title,
            job.category
        )
        
        # Analyze experience
        experience_match = await self.analyze_experience(resume, job)
        
        # Calculate overall score
        overall_score = (
            average_skill_score * 0.5 +
            role_match.overall_score * 0.3 +
            experience_match.overall_score * 0.2
        )
        
        # Generate suggestions
        suggestions = []
        
        # Skill-based suggestions
        missing_skills = [sm for sm in skill_matches if not sm.is_matched]
        if missing_skills:
            suggestions.append(
                f"Consider adding experience with: {', '.join(sm.name for sm in missing_skills[:3])}"
            )
        
        # Role-based suggestions
        if role_match.overall_score < 0.6:
            suggestions.append(
                "Highlight more relevant responsibilities in your current role"
            )
        
        # Experience-based suggestions
        if experience_match.gaps:
            suggestions.extend(experience_match.gaps)
        
        return CompatibilityReport(
            resume_id=resume.id,
            job_id=job.id,
            overall_score=overall_score,
            category=self._get_match_category(overall_score),
            skill_matches=skill_matches,
            role_match=role_match,
            experience_match=experience_match,
            matched_skills_count=len([sm for sm in skill_matches if sm.is_matched]),
            missing_skills_count=len([sm for sm in skill_matches if not sm.is_matched]),
            average_skill_score=average_skill_score,
            suggestions=suggestions,
            analysis_timestamp=datetime.utcnow().isoformat()
        ) 