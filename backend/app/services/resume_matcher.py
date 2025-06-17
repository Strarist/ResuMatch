from typing import Dict, List, Tuple, Optional
import spacy
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import pipeline
from app.core.config import settings
from app.models.resume import Resume
from app.models.job import Job
from app.schemas.matching import MatchResult, SkillMatch, ExperienceMatch, MatchStrategy

class ResumeMatcher:
    def __init__(self):
        # Load spaCy model for NER and text processing
        self.nlp = spacy.load("en_core_web_lg")
        # Load zero-shot classifier for skill matching
        self.classifier = pipeline("zero-shot-classification", 
                                 model="facebook/bart-large-mnli")
        # Load sentence transformer for semantic matching
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
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

    def calculate_semantic_similarity(self, 
                                    text1: str, 
                                    text2: str) -> float:
        """Calculate semantic similarity between two texts using embeddings."""
        # Encode texts to embeddings
        embedding1 = self.embedder.encode(text1, convert_to_tensor=True)
        embedding2 = self.embedder.encode(text2, convert_to_tensor=True)
        
        # Calculate cosine similarity
        similarity = np.dot(embedding1, embedding2) / (
            np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
        )
        return float(similarity)

    async def calculate_skill_match(self, 
                                  resume_skills: List[str], 
                                  job_skills: List[str],
                                  strategy: MatchStrategy = MatchStrategy.HYBRID) -> SkillMatch:
        """Calculate skill match score using multiple strategies."""
        matches = []
        missing = []
        
        if strategy in [MatchStrategy.KEYWORD, MatchStrategy.HYBRID]:
            # Keyword-based matching using zero-shot classification
            for skill in resume_skills:
                result = self.classifier(skill, job_skills)
                if result["scores"][0] > 0.7:  # Threshold for skill match
                    matches.append(skill)
                else:
                    missing.append(skill)
                    
            keyword_score = len(matches) / len(job_skills) if job_skills else 0
        else:
            keyword_score = 0
            
        if strategy in [MatchStrategy.SEMANTIC, MatchStrategy.HYBRID]:
            # Semantic matching using embeddings
            semantic_scores = []
            for resume_skill in resume_skills:
                max_similarity = max(
                    self.calculate_semantic_similarity(resume_skill, job_skill)
                    for job_skill in job_skills
                ) if job_skills else 0
                semantic_scores.append(max_similarity)
                
            semantic_score = sum(semantic_scores) / len(resume_skills) if resume_skills else 0
        else:
            semantic_score = 0
            
        # Calculate final score based on strategy
        if strategy == MatchStrategy.HYBRID:
            match_score = (keyword_score * 0.6 + semantic_score * 0.4)
        else:
            match_score = keyword_score if strategy == MatchStrategy.KEYWORD else semantic_score
            
        return SkillMatch(
            matched_skills=matches,
            missing_skills=missing,
            match_score=match_score,
            semantic_score=semantic_score if strategy != MatchStrategy.KEYWORD else None,
            keyword_score=keyword_score if strategy != MatchStrategy.SEMANTIC else None
        )

    async def calculate_experience_match(self, 
                                       resume: Resume, 
                                       job: Job) -> ExperienceMatch:
        """Calculate experience match based on years and relevance."""
        # Simple years of experience matching for now
        required_years = job.required_experience_years
        actual_years = resume.total_experience_years
        
        # Calculate base score from years
        years_score = min(actual_years / required_years, 1.0) if required_years > 0 else 1.0
        
        # Calculate role relevance using semantic similarity
        role_similarity = self.calculate_semantic_similarity(
            resume.role_description or "",
            job.description
        )
        
        # Combine scores (70% years, 30% role relevance)
        experience_score = years_score * 0.7 + role_similarity * 0.3
        
        return ExperienceMatch(
            required_years=required_years,
            actual_years=actual_years,
            match_score=experience_score,
            role_similarity=role_similarity
        )

    async def match_resume_to_job(self, 
                                 resume: Resume, 
                                 job: Job,
                                 strategy: MatchStrategy = MatchStrategy.HYBRID) -> MatchResult:
        """Calculate overall match between resume and job posting."""
        # Extract skills from both resume and job
        resume_skills = await self.extract_skills(resume.content)
        job_skills = await self.extract_skills(job.description)
        
        # Calculate skill match
        skill_match = await self.calculate_skill_match(
            resume_skills, 
            job_skills,
            strategy
        )
        
        # Calculate experience match
        experience_match = await self.calculate_experience_match(resume, job)
        
        # Calculate overall match score (weighted average)
        overall_score = (
            skill_match.match_score * 0.7 +  # Skills weighted more heavily
            experience_match.match_score * 0.3
        )
        
        return MatchResult(
            overall_score=overall_score,
            skill_match=skill_match,
            experience_match=experience_match,
            job_id=job.id,
            resume_id=resume.id,
            strategy=strategy
        )

    async def batch_match_resumes(self, 
                                resumes: List[Resume], 
                                job: Job,
                                strategy: MatchStrategy = MatchStrategy.HYBRID) -> List[MatchResult]:
        """Match multiple resumes against a job posting."""
        results = []
        for resume in resumes:
            match = await self.match_resume_to_job(resume, job, strategy)
            results.append(match)
        return sorted(results, key=lambda x: x.overall_score, reverse=True) 