from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from uuid import UUID
from enum import Enum

class MatchCategory(str, Enum):
    EXCELLENT = "excellent"  # > 80%
    GOOD = "good"          # 60-80%
    FAIR = "fair"          # 40-60%
    POOR = "poor"          # < 40%

class SkillMatch(BaseModel):
    name: str
    score: float = Field(ge=0, le=1)
    category: str
    semantic_score: Optional[float] = None
    keyword_score: Optional[float] = None
    is_matched: bool
    suggestions: Optional[List[str]] = None

class RoleMatch(BaseModel):
    title_similarity: float = Field(ge=0, le=1)
    category_match: float = Field(ge=0, le=1)
    required_level: Optional[str] = None
    current_level: Optional[str] = None
    overall_score: float = Field(ge=0, le=1)
    category: MatchCategory

class ExperienceMatch(BaseModel):
    years_match: float = Field(ge=0, le=1)
    role_relevance: float = Field(ge=0, le=1)
    required_years: float
    actual_years: float
    overall_score: float = Field(ge=0, le=1)
    category: MatchCategory
    gaps: Optional[List[str]] = None

class CompatibilityReport(BaseModel):
    resume_id: UUID
    job_id: UUID
    overall_score: float = Field(ge=0, le=1)
    category: MatchCategory
    
    # Detailed matches
    skill_matches: List[SkillMatch]
    role_match: RoleMatch
    experience_match: ExperienceMatch
    
    # Summary statistics
    matched_skills_count: int
    missing_skills_count: int
    average_skill_score: float
    
    # Improvement suggestions
    suggestions: List[str]
    
    # Additional metadata
    analysis_timestamp: str
    match_strategy: str = "hybrid"  # hybrid, semantic, or keyword

class CompatibilityRequest(BaseModel):
    resume_id: UUID
    job_id: UUID
    strategy: str = "hybrid"

class CompatibilityResponse(BaseModel):
    report: CompatibilityReport
    processing_time: float  # in seconds
    cached: bool = False 