from typing import Dict, List, Tuple, Optional
import re
from datetime import datetime
from app.models.resume import Resume
from app.models.job import Job
from app.schemas.matching import (
    MatchResult, SkillMatch, ExperienceMatch, EducationMatch, RoleMatch,
    MatchDimension, MatchStrategy, ExperienceLevel, DegreeLevel
)

class ResumeMatcher:
    def __init__(self) -> None:
        # Enhanced skill keywords for better matching
        self.skill_keywords = [
            # Programming Languages
            'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
            'node.js', 'fastapi', 'django', 'flask', 'spring', 'express', 'c++', 'c#',
            'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'r', 'matlab',
            
            # Databases
            'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'cassandra', 'elasticsearch',
            'dynamodb', 'oracle', 'sqlite', 'mariadb',
            
            # Cloud & DevOps
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ansible',
            'jenkins', 'git', 'ci/cd', 'agile', 'scrum', 'devops', 'microservices',
            
            # Frameworks & Libraries
            'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'matplotlib',
            'seaborn', 'plotly', 'bootstrap', 'tailwind', 'sass', 'less', 'webpack',
            'babel', 'eslint', 'prettier',
            
            # Tools & Platforms
            'jira', 'confluence', 'slack', 'teams', 'zoom', 'figma', 'sketch',
            'adobe', 'photoshop', 'illustrator', 'linux', 'unix', 'bash', 'shell',
            'powershell', 'vim', 'emacs', 'vscode', 'intellij', 'eclipse',
            
            # Methodologies
            'agile', 'scrum', 'kanban', 'waterfall', 'tdd', 'bdd', 'rest', 'graphql',
            
            # Soft Skills
            'leadership', 'communication', 'teamwork', 'problem-solving', 'analytical',
            'creative', 'collaboration', 'project management', 'stakeholder management',
            
            # Certifications
            'aws certified', 'azure certified', 'google cloud', 'pmp', 'scrum master',
            'agile certified', 'cisco', 'comptia'
        ]
        
    def extract_skills(self, text: str) -> List[str]:
        """Extract skills from text using enhanced keyword matching."""
        if not text:
            return []
        
        text_lower = text.lower()
        found_skills = []
        
        for skill in self.skill_keywords:
            if skill in text_lower:
                found_skills.append(skill)
        
        return list(set(found_skills))

    def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts using word overlap."""
        if not text1 or not text2:
            return 0.0
        
        # Simple word overlap similarity
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0

    def calculate_skill_match(self, job_skills: List[str], resume_skills: List[str]) -> SkillMatch:
        """Calculate comprehensive skill match between job and resume."""
        if not job_skills or not resume_skills:
            return SkillMatch(
                overall_score=0.0,
                matched_skills=[],
                missing_skills=job_skills,
                category_scores={},
                suggestions=["Add relevant skills to your resume"]
            )
        
        # Calculate overlap
        job_skill_set = set(job_skills)
        resume_skill_set = set(resume_skills)
        
        matched_skills = list(job_skill_set.intersection(resume_skill_set))
        missing_skills = list(job_skill_set - resume_skill_set)
        
        # Calculate match percentage
        match_percentage = len(matched_skills) / len(job_skill_set) if job_skill_set else 0.0
        
        # Generate suggestions
        suggestions = []
        if missing_skills:
            suggestions.append(f"Add these skills to your resume: {', '.join(missing_skills[:5])}")
        if len(matched_skills) < len(job_skills) * 0.5:
            suggestions.append("Consider adding more relevant technical skills")
        
        return SkillMatch(
            overall_score=match_percentage,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            category_scores={},
            suggestions=suggestions
        )

    def calculate_experience_match(self, job_description: str, resume_experience: str) -> ExperienceMatch:
        """Calculate experience match between job and resume."""
        if not job_description or not resume_experience:
            return ExperienceMatch(
                years_match=0.0,
                level_match=0.0,
                relevant_experience=[],
                required_years=0.0,
                actual_years=0.0,
                suggestions=["Add more experience details to your resume"]
            )
        
        # Calculate similarity
        role_similarity = self.calculate_semantic_similarity(job_description, resume_experience)
        
        # Extract years of experience
        actual_years = self._extract_experience_years(resume_experience)
        required_years = self._extract_required_experience(job_description)
        
        # Calculate years match
        years_match = min(actual_years / required_years, 1.0) if required_years > 0 else 1.0
        
        # Calculate level match
        level_match = role_similarity
        
        # Generate suggestions
        suggestions = []
        if years_match < 0.8:
            suggestions.append(f"Consider highlighting {required_years - actual_years:.1f} more years of relevant experience")
        if level_match < 0.6:
            suggestions.append("Add more details about your current role's responsibilities")
        
        return ExperienceMatch(
            years_match=years_match,
            level_match=level_match,
            relevant_experience=[],
            required_years=required_years,
            actual_years=actual_years,
            suggestions=suggestions
        )

    def calculate_education_match(self, job_requirements: str, resume_education: str) -> EducationMatch:
        """Calculate education match between job and resume."""
        if not job_requirements or not resume_education:
            return EducationMatch(
                match_score=0.0,
                level_match=0.0,
                field_relevance=0.0,
                highest_degree=None,
                required_education=None,
                missing_requirements=[],
                suggestions=["Add education details to your resume"]
            )
        
        # Calculate field relevance
        field_relevance = self.calculate_semantic_similarity(job_requirements, resume_education)
        
        # Extract education level
        education_level = self._extract_education_level(resume_education)
        required_level = self._extract_required_education_level(job_requirements)
        
        # Calculate level match
        level_match = self._calculate_level_match(education_level, required_level)
        
        # Overall match score
        match_score = (field_relevance * 0.6) + (level_match * 0.4)
        
        # Generate suggestions
        suggestions = []
        if level_match < 0.8:
            suggestions.append("Consider pursuing higher education or certifications")
        if field_relevance < 0.6:
            suggestions.append("Highlight relevant coursework or certifications")
        
        return EducationMatch(
            match_score=match_score,
            level_match=level_match,
            field_relevance=field_relevance,
            highest_degree=None,
            required_education=None,
            missing_requirements=[],
            suggestions=suggestions
        )

    def calculate_role_match(self, job_title: str, resume_title: str) -> RoleMatch:
        """Calculate role match between job and resume."""
        if not job_title or not resume_title:
            return RoleMatch(
                title_similarity=0.0,
                level_match=0.0,
                required_level=ExperienceLevel.ENTRY,
                actual_level=ExperienceLevel.ENTRY,
                explanation="No role information available",
                suggestions=["Add current job title to your resume"]
            )
        
        # Calculate title similarity
        title_similarity = self.calculate_semantic_similarity(job_title, resume_title)
        
        # Determine experience levels
        required_level = self._extract_job_level(job_title)
        actual_level = self._extract_job_level(resume_title)
        
        # Calculate level match
        level_match = self._calculate_level_match(actual_level, required_level)
        
        # Generate explanation
        explanation = f"Your role as {resume_title} matches {job_title} with {title_similarity:.1%} similarity"
        
        # Generate suggestions
        suggestions = []
        if title_similarity < 0.6:
            suggestions.append("Consider highlighting relevant aspects of your current role")
        if level_match < 0.8:
            suggestions.append("Emphasize leadership and senior responsibilities")
        
        return RoleMatch(
            title_similarity=title_similarity,
            level_match=level_match,
            required_level=required_level,
            actual_level=actual_level,
            explanation=explanation,
            suggestions=suggestions
        )

    def _extract_experience_years(self, text: str) -> float:
        """Extract years of experience from text."""
        patterns = [
            r'(\d+)\s*years?',
            r'(\d+)\+?\s*years?',
            r'(\d+)\s*yr'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                return float(match.group(1))
        
        return 0.0

    def _extract_required_experience(self, text: str) -> float:
        """Extract required years of experience from job description."""
        patterns = [
            r'(\d+)\+?\s*years?\s*experience',
            r'experience[:\s]*(\d+)\s*years?',
            r'minimum\s*(\d+)\s*years?'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                return float(match.group(1))
        
        return 3.0  # Default assumption

    def _extract_education_level(self, text: str) -> DegreeLevel:
        """Extract education level from text."""
        text_lower = text.lower()
        
        if 'phd' in text_lower or 'doctorate' in text_lower:
            return DegreeLevel.PHD
        elif 'master' in text_lower or 'ms' in text_lower:
            return DegreeLevel.MASTERS
        elif 'bachelor' in text_lower or 'bs' in text_lower or 'ba' in text_lower:
            return DegreeLevel.BACHELORS
        elif 'associate' in text_lower:
            return DegreeLevel.ASSOCIATE
        else:
            return DegreeLevel.BACHELORS  # Default

    def _extract_required_education_level(self, text: str) -> DegreeLevel:
        """Extract required education level from job requirements."""
        text_lower = text.lower()
        
        if 'phd' in text_lower or 'doctorate' in text_lower:
            return DegreeLevel.PHD
        elif 'master' in text_lower or 'ms' in text_lower:
            return DegreeLevel.MASTERS
        elif 'bachelor' in text_lower or 'bs' in text_lower:
            return DegreeLevel.BACHELORS
        else:
            return DegreeLevel.BACHELORS  # Default

    def _extract_job_level(self, title: str) -> ExperienceLevel:
        """Extract job level from title."""
        title_lower = title.lower()
        
        if any(word in title_lower for word in ['executive', 'vp', 'director', 'head']):
            return ExperienceLevel.EXECUTIVE
        elif any(word in title_lower for word in ['lead', 'principal', 'staff']):
            return ExperienceLevel.LEAD
        elif any(word in title_lower for word in ['senior', 'sr']):
            return ExperienceLevel.SENIOR
        elif any(word in title_lower for word in ['junior', 'jr', 'entry']):
            return ExperienceLevel.ENTRY
        else:
            return ExperienceLevel.MID

    def _calculate_level_match(self, actual_level, required_level) -> float:
        """Calculate match between actual and required levels."""
        level_values = {
            ExperienceLevel.ENTRY: 1,
            ExperienceLevel.MID: 2,
            ExperienceLevel.SENIOR: 3,
            ExperienceLevel.LEAD: 4,
            ExperienceLevel.EXECUTIVE: 5
        }
        
        actual_value = level_values.get(actual_level, 2)
        required_value = level_values.get(required_level, 2)
        
        if actual_value >= required_value:
            return 1.0
        else:
            return max(0.0, actual_value / required_value)

    def match_resume_to_job(self, resume: Resume, job: Job) -> MatchResult:
        """Match a resume to a job with comprehensive analysis."""
        # Extract skills
        job_skills = self.extract_skills(job.requirements or "")
        resume_skills = self.extract_skills(resume.skills or "")
        
        # Calculate various matches
        skill_match = self.calculate_skill_match(job_skills, resume_skills)
        experience_match = self.calculate_experience_match(
            job.description or "",
            resume.experience or ""
        )
        education_match = self.calculate_education_match(
            job.requirements or "",
            resume.education or ""
        )
        role_match = self.calculate_role_match(
            job.title or "",
            resume.title or ""
        )
        
        # Calculate overall score with weighted components
        overall_score = (
            skill_match.overall_score * 0.35 +
            experience_match.years_match * 0.25 +
            education_match.match_score * 0.20 +
            role_match.title_similarity * 0.20
        )
        
        # Create dimensions
        dimensions = [
            MatchDimension(
                name="Skills",
                score=skill_match.overall_score,
                weight=0.35,
                description="Technical and soft skills match"
            ),
            MatchDimension(
                name="Experience",
                score=experience_match.years_match,
                weight=0.25,
                description="Years of relevant experience"
            ),
            MatchDimension(
                name="Education",
                score=education_match.match_score,
                weight=0.20,
                description="Educational background and qualifications"
            ),
            MatchDimension(
                name="Role",
                score=role_match.title_similarity,
                weight=0.20,
                description="Job title and level compatibility"
            )
        ]
        
        # Combine suggestions
        all_suggestions = (
            skill_match.suggestions +
            experience_match.suggestions +
            education_match.suggestions +
            role_match.suggestions
        )
        
        return MatchResult(
            overall_score=overall_score,
            resume_id=str(resume.id),
            job_id=str(job.id),
            timestamp=datetime.utcnow(),
            education_match=education_match,
            skill_match=skill_match,
            experience_match=experience_match,
            role_match=role_match,
            dimensions=dimensions,
            suggestions=all_suggestions,
            metadata={
                "resume_title": resume.title,
                "job_title": job.title,
                "match_strategy": MatchStrategy.HYBRID
            }
        )

    def batch_match_resumes(self, resumes: List[Resume], jobs: List[Job]) -> List[MatchResult]:
        """Batch match multiple resumes to jobs."""
        matches = []
        
        for resume in resumes:
            for job in jobs:
                match = self.match_resume_to_job(resume, job)
                matches.append(match)
        
        # Sort by overall score (descending)
        matches.sort(key=lambda x: x.overall_score, reverse=True)
        
        return matches
