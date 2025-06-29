import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Tuple
import logging
import re

logger = logging.getLogger(__name__)

class SkillsMatcher:
    def __init__(self):
        """Initialize the skills matcher with sentence transformer model"""
        try:
            # Use a lightweight model for fast inference
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Loaded sentence transformer model successfully")
        except Exception as e:
            logger.error(f"Error loading sentence transformer model: {e}")
            raise
    
    def get_embeddings(self, skills: List[str]) -> np.ndarray:
        """Get embeddings for a list of skills"""
        if not skills:
            return np.array([])
        
        try:
            # Convert skills to embeddings
            embeddings = self.model.encode(skills)
            return embeddings
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return np.array([])
    
    def calculate_similarity(self, resume_skills: List[str], job_skills: List[str]) -> float:
        """Calculate similarity between resume skills and job skills"""
        if not resume_skills or not job_skills:
            return 0.0
        
        try:
            # Get embeddings for both skill sets
            resume_embeddings = self.get_embeddings(resume_skills)
            job_embeddings = self.get_embeddings(job_skills)
            
            if resume_embeddings.size == 0 or job_embeddings.size == 0:
                return 0.0
            
            # Calculate cosine similarity matrix
            similarity_matrix = cosine_similarity(resume_embeddings, job_embeddings)
            
            # Calculate overall similarity score
            # Method 1: Average of maximum similarities for each resume skill
            max_similarities = np.max(similarity_matrix, axis=1)
            avg_similarity = np.mean(max_similarities)
            
            # Method 2: Weighted average based on skill importance
            # For now, we'll use simple average, but this can be enhanced
            return float(avg_similarity)
            
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0
    
    def get_detailed_matching(self, resume_skills: List[str], job_skills: List[str]) -> Dict:
        """Get detailed matching information including individual skill matches"""
        if not resume_skills or not job_skills:
            return {
                'overall_score': 0.0,
                'skill_matches': [],
                'missing_skills': job_skills,
                'extra_skills': resume_skills
            }
        
        try:
            # Get embeddings
            resume_embeddings = self.get_embeddings(resume_skills)
            job_embeddings = self.get_embeddings(job_skills)
            
            if resume_embeddings.size == 0 or job_embeddings.size == 0:
                return {
                    'overall_score': 0.0,
                    'skill_matches': [],
                    'missing_skills': job_skills,
                    'extra_skills': resume_skills
                }
            
            # Calculate similarity matrix
            similarity_matrix = cosine_similarity(resume_embeddings, job_embeddings)
            
            # Find best matches for each resume skill
            skill_matches = []
            matched_job_skills = set()
            
            for i, resume_skill in enumerate(resume_skills):
                best_match_idx = np.argmax(similarity_matrix[i])
                best_match_score = similarity_matrix[i][best_match_idx]
                best_match_skill = job_skills[best_match_idx]
                
                skill_matches.append({
                    'resume_skill': resume_skill,
                    'job_skill': best_match_skill,
                    'similarity_score': float(best_match_score),
                    'is_good_match': best_match_score > 0.7  # Threshold for good match
                })
                
                if best_match_score > 0.7:
                    matched_job_skills.add(best_match_skill)
            
            # Calculate overall score
            overall_score = np.mean([match['similarity_score'] for match in skill_matches])
            
            # Find missing and extra skills
            missing_skills = [skill for skill in job_skills if skill not in matched_job_skills]
            extra_skills = [skill for skill in resume_skills if not any(
                match['resume_skill'] == skill and match['similarity_score'] > 0.7 
                for match in skill_matches
            )]
            
            return {
                'overall_score': float(overall_score),
                'skill_matches': skill_matches,
                'missing_skills': missing_skills,
                'extra_skills': extra_skills,
                'match_percentage': len(matched_job_skills) / len(job_skills) if job_skills else 0.0
            }
            
        except Exception as e:
            logger.error(f"Error in detailed matching: {e}")
            return {
                'overall_score': 0.0,
                'skill_matches': [],
                'missing_skills': job_skills,
                'extra_skills': resume_skills
            }
    
    def calculate_experience_match(self, resume_experience: List[str], job_experience: List[str]) -> float:
        """Calculate experience level match"""
        if not job_experience:
            return 1.0  # No experience requirement specified
        
        try:
            # Extract years from experience requirements
            job_years = []
            for exp in job_experience:
                years_match = re.search(r'(\d+)', exp)
                if years_match:
                    job_years.append(int(years_match.group(1)))
            
            if not job_years:
                return 0.5  # Default score if we can't parse experience
            
            # For now, return a simple score based on whether experience is mentioned
            # This can be enhanced with actual experience parsing
            return 0.7 if resume_experience else 0.3
            
        except Exception as e:
            logger.error(f"Error calculating experience match: {e}")
            return 0.5
    
    def calculate_education_match(self, resume_education: List[str], job_education: List[str]) -> float:
        """Calculate education level match"""
        if not job_education:
            return 1.0  # No education requirement specified
        
        try:
            # Simple education level scoring
            education_levels = {
                'bachelor': 1,
                'ba': 1,
                'bs': 1,
                'b.sc': 1,
                'master': 2,
                'ma': 2,
                'ms': 2,
                'm.sc': 2,
                'phd': 3,
                'doctorate': 3
            }
            
            resume_level = 0
            job_level = 0
            
            for edu in resume_education:
                for level, score in education_levels.items():
                    if level in edu.lower():
                        resume_level = max(resume_level, score)
                        break
            
            for edu in job_education:
                for level, score in education_levels.items():
                    if level in edu.lower():
                        job_level = max(job_level, score)
                        break
            
            if resume_level >= job_level:
                return 1.0
            elif resume_level > 0:
                return 0.7
            else:
                return 0.3
                
        except Exception as e:
            logger.error(f"Error calculating education match: {e}")
            return 0.5
    
    def calculate_overall_match_score(
        self, 
        resume_data: Dict, 
        job_data: Dict,
        weights: Dict = None
    ) -> Dict:
        """Calculate overall match score considering skills, experience, and education"""
        
        # Default weights
        if weights is None:
            weights = {
                'skills': 0.6,
                'experience': 0.25,
                'education': 0.15
            }
        
        try:
            # Calculate individual scores
            skills_score = self.calculate_similarity(
                resume_data.get('skills', []), 
                job_data.get('skills', [])
            )
            
            experience_score = self.calculate_experience_match(
                resume_data.get('experience', []), 
                job_data.get('experience', [])
            )
            
            education_score = self.calculate_education_match(
                resume_data.get('education', []), 
                job_data.get('education', [])
            )
            
            # Calculate weighted overall score
            overall_score = (
                skills_score * weights['skills'] +
                experience_score * weights['experience'] +
                education_score * weights['education']
            )
            
            return {
                'overall_score': float(overall_score),
                'skills_score': float(skills_score),
                'experience_score': float(experience_score),
                'education_score': float(education_score),
                'weights': weights
            }
            
        except Exception as e:
            logger.error(f"Error calculating overall match score: {e}")
            return {
                'overall_score': 0.0,
                'skills_score': 0.0,
                'experience_score': 0.0,
                'education_score': 0.0,
                'weights': weights
            }

# Global instance for reuse
skills_matcher = SkillsMatcher() 