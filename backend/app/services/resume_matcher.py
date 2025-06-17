from typing import Dict, List, Tuple, Optional
import spacy
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import pipeline
from app.core.config import settings
from app.models.resume import Resume
from app.models.job import Job
from app.schemas.matching import MatchResult, SkillMatch, ExperienceMatch, MatchStrategy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

class ResumeMatcher:
    def __init__(self) -> None:
        # Load spaCy model for NER and text processing
        self.nlp = spacy.load("en_core_web_lg")
        # Load zero-shot classifier for skill matching
        self.classifier = pipeline("zero-shot-classification", 
                                 model="facebook/bart-large-mnli")
        # Load sentence transformer for semantic matching
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.skill_keywords = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue',
            'node.js', 'fastapi', 'django', 'flask', 'sql', 'postgresql',
            'mysql', 'mongodb', 'redis', 'docker', 'kubernetes', 'aws',
            'azure', 'gcp', 'git', 'jenkins', 'ci/cd', 'agile', 'scrum'
        ]
        
    async def extract_skills(self, text: str) -> List[str]:
        """Extract skills from resume text using NLP."""
        doc = self.nlp(text)
        # Extract noun phrases and named entities that might be skills
        skills = set()
        for ent in doc.ents:
            if ent.label_ in ["ORG", "PRODUCT"]:
                skills.add(ent.text.lower())
        # Also extract noun phrases that might be skills
        for chunk in doc.noun_chunks:
            if len(chunk.text.split()) <= 3:  # Avoid long phrases
                skills.add(chunk.text.lower())
        return list(skills)

    def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity between two texts"""
        if not text1 or not text2:
            return 0.0
            
        # Combine texts for vectorization
        combined_text = [text1, text2]
        vectors = self.vectorizer.fit_transform(combined_text)
        
        # Calculate cosine similarity
        similarity_matrix = cosine_similarity(vectors)
        return float(similarity_matrix[0, 1])

    async def calculate_skill_match(self, job_skills: List[str], resume_skills: List[str]) -> SkillMatch:
        """Calculate skill match between job and resume"""
        if not job_skills or not resume_skills:
            return SkillMatch(
                matched_skills=[],
                missing_skills=job_skills,
                match_percentage=0.0
            )
        
        # Calculate overlap
        job_skill_set = set(job_skills)
        resume_skill_set = set(resume_skills)
        
        matched_skills = list(job_skill_set.intersection(resume_skill_set))
        missing_skills = list(job_skill_set - resume_skill_set)
        
        # Calculate match percentage
        match_percentage = len(matched_skills) / len(job_skill_set) if job_skill_set else 0.0
        
        return SkillMatch(
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            match_percentage=match_percentage
        )

    async def calculate_experience_match(self, job_description: str, resume_experience: str) -> ExperienceMatch:
        """Calculate experience match between job and resume"""
        if not job_description or not resume_experience:
            return ExperienceMatch(
                role_similarity=0.0,
                experience_years=0,
                match_score=0.0
            )
        
        # Calculate semantic similarity
        role_similarity = self.calculate_semantic_similarity(job_description, resume_experience)
        
        # Extract years of experience (simplified)
        experience_years = self._extract_experience_years(resume_experience)
        
        # Calculate match score
        match_score = (role_similarity * 0.7) + (min(experience_years / 10, 1.0) * 0.3)
        
        return ExperienceMatch(
            role_similarity=role_similarity,
            experience_years=experience_years,
            match_score=match_score
        )

    def _extract_experience_years(self, text: str) -> int:
        """Extract years of experience from text"""
        # Look for patterns like "5 years", "3+ years", etc.
        patterns = [
            r'(\d+)\s*years?',
            r'(\d+)\+?\s*years?',
            r'(\d+)\s*yr'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                return int(match.group(1))
        
        return 0

    def match_resume_to_job(self, resume: Resume, job: Job) -> MatchResult:
        """Match a resume to a job"""
        # Extract skills
        job_skills = self.extract_skills(job.requirements or "")
        resume_skills = self.extract_skills(resume.skills or "")
        
        # Calculate skill match
        skill_match = self.calculate_skill_match(job_skills, resume_skills)
        
        # Calculate experience match
        experience_match = self.calculate_experience_match(
            job.description or "",
            resume.experience or ""
        )
        
        # Calculate overall score
        overall_score = (skill_match.match_percentage * 0.6) + (experience_match.match_score * 0.4)
        
        return MatchResult(
            job_id=str(job.id),
            resume_id=str(resume.id),
            skill_match=skill_match,
            experience_match=experience_match,
            overall_score=overall_score,
            strategy=MatchStrategy.AI_DRIVEN
        )

    def batch_match_resumes(self, resumes: List[Resume], jobs: List[Job]) -> List[MatchResult]:
        """Batch match multiple resumes to jobs"""
        matches = []
        
        for resume in resumes:
            for job in jobs:
                match = self.match_resume_to_job(resume, job)
                matches.append(match)
        
        # Sort by overall score (descending)
        matches.sort(key=lambda x: x.overall_score, reverse=True)
        
        return matches

    def get_top_matches(self, resume: Resume, jobs: List[Job], top_k: int = 5) -> List[MatchResult]:
        """Get top k matches for a resume"""
        matches = []
        
        for job in jobs:
            match = self.match_resume_to_job(resume, job)
            matches.append(match)
        
        # Sort by overall score and return top k
        matches.sort(key=lambda x: x.overall_score, reverse=True)
        return matches[:top_k] 