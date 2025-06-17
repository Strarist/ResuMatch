import asyncio
from typing import List, Dict, Optional, Tuple, Any
import numpy as np
from sentence_transformers import SentenceTransformer
from app.core.cache import Cache
from app.core.config import settings
from app.models.job import Job
from app.models.resume import Resume
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from app.schemas.matching import RoleMatch, RoleSimilarity

class RoleMatcher:
    def __init__(self) -> None:
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.cache = Cache(str(settings.REDIS_URL))
        
        # Common job title variations
        self.title_variations = {
            'software engineer': [
                'software developer',
                'application developer',
                'programmer',
                'coder'
            ],
            'data scientist': [
                'machine learning engineer',
                'ai engineer',
                'data analyst',
                'ml engineer'
            ],
            'product manager': [
                'product owner',
                'technical product manager',
                'product lead'
            ],
            # Add more common variations
        }
        
        # Pre-compute embeddings for common titles
        self._init_common_embeddings()

        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.job_titles = []
        self.job_vectors = None

    def _init_common_embeddings(self) -> None:
        """Pre-compute embeddings for common job titles."""
        all_titles = []
        for main_title, variations in self.title_variations.items():
            all_titles.extend([main_title] + variations)
        
        # Get unique titles
        unique_titles = list(set(all_titles))
        
        # Compute embeddings
        embeddings = self.model.encode(
            unique_titles,
            convert_to_tensor=True,
            show_progress_bar=True
        )
        
        # Store in cache
        for title, embedding in zip(unique_titles, embeddings):
            cache_key = f"role_embedding:{title.lower()}"
            asyncio.create_task(self.cache.set(
                cache_key,
                embedding.cpu().numpy().tobytes(),
                expire=86400  # 24 hours
            ))

    async def get_role_embedding(self, title: str) -> np.ndarray:
        """Get role embedding from cache or compute it."""
        cache_key = f"role_embedding:{title.lower()}"
        cached = await self.cache.get(cache_key)
        
        if cached:
            return np.frombuffer(cached, dtype=np.float32)
        
        # Compute and cache embedding
        embedding = self.model.encode(
            title,
            convert_to_tensor=True
        ).cpu().numpy()
        
        await self.cache.set(
            cache_key,
            embedding.tobytes(),
            expire=86400  # 24 hours
        )
        
        return embedding

    async def get_title_variations(self, title: str) -> List[str]:
        """Get similar job titles based on common variations."""
        title_lower = title.lower()
        
        # Check direct matches
        for main_title, variations in self.title_variations.items():
            if title_lower == main_title:
                return variations
            if title_lower in variations:
                return [main_title] + [v for v in variations if v != title_lower]
        
        # If no direct match, find semantic matches
        title_embedding = await self.get_role_embedding(title)
        
        similarities = []
        for main_title, variations in self.title_variations.items():
            main_embedding = await self.get_role_embedding(main_title)
            similarity = np.dot(title_embedding, main_embedding) / (
                np.linalg.norm(title_embedding) * np.linalg.norm(main_embedding)
            )
            similarities.append((main_title, similarity))
        
        # Get top 3 matches
        top_matches = sorted(similarities, key=lambda x: x[1], reverse=True)[:3]
        
        variations = []
        for match_title, _ in top_matches:
            variations.extend(self.title_variations[match_title])
        
        return list(set(variations))

    async def calculate_role_similarity(
        self,
        resume_role: Optional[str],
        job_title: str,
        job_description: str
    ) -> Tuple[float, float, List[str]]:
        """
        Calculate role similarity using multiple methods:
        1. Title similarity (semantic + variations)
        2. Description relevance
        3. Category match
        """
        if not resume_role:
            return 0.0, 0.0, []
        
        # Get title variations
        job_variations = await self.get_title_variations(job_title)
        resume_variations = await self.get_title_variations(resume_role)
        
        # Calculate title similarity
        title_embeddings = await asyncio.gather(
            *[self.get_role_embedding(t) for t in [resume_role, job_title] + job_variations + resume_variations]
        )
        
        resume_embedding = title_embeddings[0]
        job_embedding = title_embeddings[1]
        
        # Direct title similarity
        direct_similarity = np.dot(resume_embedding, job_embedding) / (
            np.linalg.norm(resume_embedding) * np.linalg.norm(job_embedding)
        )
        
        # Variation-based similarity
        variation_similarities = []
        for var_embedding in title_embeddings[2:]:
            similarity = np.dot(resume_embedding, var_embedding) / (
                np.linalg.norm(resume_embedding) * np.linalg.norm(var_embedding)
            )
            variation_similarities.append(similarity)
        
        max_variation_similarity = max(variation_similarities) if variation_similarities else 0
        
        # Calculate description relevance
        desc_embedding = self.model.encode(
            job_description,
            convert_to_tensor=True
        ).cpu().numpy()
        
        desc_similarity = np.dot(resume_embedding, desc_embedding) / (
            np.linalg.norm(resume_embedding) * np.linalg.norm(desc_embedding)
        )
        
        # Combine scores
        title_score = max(direct_similarity, max_variation_similarity)
        desc_score = desc_similarity
        
        # Get relevant variations for suggestions
        relevant_variations = []
        if direct_similarity < 0.7:  # If direct match is not strong
            for var, sim in zip(job_variations, variation_similarities[:len(job_variations)]):
                if sim > 0.7:  # Only include strong matches
                    relevant_variations.append(var)
        
        return title_score, desc_score, relevant_variations

    async def analyze_role_match(
        self,
        resume: Resume,
        job: Job
    ) -> Dict:
        """Analyze role match and return detailed insights."""
        title_score, desc_score, variations = await self.calculate_role_similarity(
            resume.role_description,
            job.title,
            job.description
        )
        
        # Calculate overall score
        overall_score = (title_score * 0.6 + desc_score * 0.4)
        
        # Generate insights
        insights = []
        if title_score < 0.7:
            insights.append({
                'type': 'title',
                'message': 'Consider using a more relevant job title',
                'suggestions': variations[:3]  # Top 3 variations
            })
        
        if desc_score < 0.6:
            insights.append({
                'type': 'description',
                'message': 'Add more relevant responsibilities to your role description',
                'suggestions': [
                    'Highlight key achievements',
                    'Include specific technologies used',
                    'Quantify your impact'
                ]
            })
        
        return {
            'title_similarity': float(title_score),
            'description_relevance': float(desc_score),
            'overall_score': float(overall_score),
            'insights': insights,
            'suggested_variations': variations
        }

    def fit(self, job_titles: List[str]) -> None:
        """Fit the vectorizer on job titles"""
        self.job_titles = job_titles
        if job_titles:
            self.job_vectors = self.vectorizer.fit_transform(job_titles)
    
    def calculate_role_similarity(self, job_title: str, resume_title: str) -> float:
        """Calculate similarity between job title and resume title"""
        if not job_title or not resume_title:
            return 0.0
            
        # Combine titles for vectorization
        combined_text = [job_title, resume_title]
        vectors = self.vectorizer.transform(combined_text)
        
        # Calculate cosine similarity
        similarity_matrix = cosine_similarity(vectors)
        return float(similarity_matrix[0, 1])
    
    def extract_role_keywords(self, text: str) -> List[str]:
        """Extract role-related keywords from text"""
        if not text:
            return []
            
        # Common role keywords
        role_keywords = [
            'developer', 'engineer', 'manager', 'analyst', 'specialist',
            'coordinator', 'director', 'lead', 'architect', 'consultant',
            'administrator', 'designer', 'researcher', 'scientist'
        ]
        
        text_lower = text.lower()
        found_keywords = []
        
        for keyword in role_keywords:
            if keyword in text_lower:
                found_keywords.append(keyword)
                
        return found_keywords
    
    def calculate_title_similarity(self, job_title: str, resume_title: str) -> float:
        """Calculate title similarity using multiple methods"""
        if not job_title or not resume_title:
            return 0.0
            
        # Method 1: Exact match
        if job_title.lower() == resume_title.lower():
            return 1.0
            
        # Method 2: Contains match
        if job_title.lower() in resume_title.lower() or resume_title.lower() in job_title.lower():
            return 0.8
            
        # Method 3: Keyword overlap
        job_keywords = set(self.extract_role_keywords(job_title))
        resume_keywords = set(self.extract_role_keywords(resume_title))
        
        if job_keywords and resume_keywords:
            overlap = len(job_keywords.intersection(resume_keywords))
            union = len(job_keywords.union(resume_keywords))
            if union > 0:
                return overlap / union
                
        # Method 4: TF-IDF similarity
        return self.calculate_role_similarity(job_title, resume_title)
    
    def match_job_to_resume(self, job: Job, resume: Resume) -> RoleMatch:
        """Match a job to a resume based on role similarity"""
        # Extract titles
        job_title = job.title if job.title else ""
        resume_title = resume.title if hasattr(resume, 'title') and resume.title else ""
        
        # Calculate similarity scores
        title_similarity = self.calculate_title_similarity(job_title, resume_title)
        
        # Extract keywords
        job_keywords = self.extract_role_keywords(job_title)
        resume_keywords = self.extract_role_keywords(resume_title)
        
        # Calculate keyword overlap
        job_keyword_set = set(job_keywords)
        resume_keyword_set = set(resume_keywords)
        
        keyword_overlap = 0.0
        if job_keyword_set and resume_keyword_set:
            overlap = len(job_keyword_set.intersection(resume_keyword_set))
            union = len(job_keyword_set.union(resume_keyword_set))
            if union > 0:
                keyword_overlap = overlap / union
        
        # Calculate overall score
        overall_score = (title_similarity * 0.7) + (keyword_overlap * 0.3)
        
        return RoleMatch(
            job_id=str(job.id),
            resume_id=str(resume.id),
            title_similarity=title_similarity,
            keyword_overlap=keyword_overlap,
            overall_score=overall_score,
            matched_keywords=list(job_keyword_set.intersection(resume_keyword_set)),
            missing_keywords=list(job_keyword_set - resume_keyword_set)
        )
    
    def batch_match_roles(self, jobs: List[Job], resumes: List[Resume]) -> List[RoleMatch]:
        """Batch match multiple jobs to resumes"""
        matches = []
        
        for job in jobs:
            for resume in resumes:
                match = self.match_job_to_resume(job, resume)
                matches.append(match)
                
        return matches
    
    def get_role_recommendations(self, resume_title: str, job_titles: List[str], top_k: int = 5) -> List[RoleSimilarity]:
        """Get role recommendations based on resume title"""
        if not resume_title or not job_titles:
            return []
            
        similarities = []
        
        for job_title in job_titles:
            similarity = self.calculate_title_similarity(job_title, resume_title)
            similarities.append(RoleSimilarity(
                job_title=job_title,
                similarity_score=similarity
            ))
        
        # Sort by similarity score (descending)
        similarities.sort(key=lambda x: x.similarity_score, reverse=True)
        
        return similarities[:top_k]
    
    def analyze_role_trends(self, job_titles: List[str]) -> Dict[str, Any]:
        """Analyze role trends in job titles"""
        if not job_titles:
            return {}
            
        # Extract keywords from all titles
        all_keywords = []
        for title in job_titles:
            keywords = self.extract_role_keywords(title)
            all_keywords.extend(keywords)
        
        # Count keyword frequencies
        keyword_counts = {}
        for keyword in all_keywords:
            keyword_counts[keyword] = keyword_counts.get(keyword, 0) + 1
        
        # Get top keywords
        top_keywords = sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            'total_jobs': len(job_titles),
            'unique_keywords': len(set(all_keywords)),
            'top_keywords': dict(top_keywords),
            'keyword_distribution': keyword_counts
        } 