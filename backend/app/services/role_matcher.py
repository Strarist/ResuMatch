from typing import List, Dict, Optional, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
from app.core.cache import get_cache, Cache
from app.models.job import Job
from app.models.resume import Resume

class RoleMatcher:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.cache = get_cache()
        
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

    def _init_common_embeddings(self):
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
            self.cache.set(
                cache_key,
                embedding.cpu().numpy().tobytes(),
                expire=86400  # 24 hours
            )

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