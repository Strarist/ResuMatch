from typing import List, Dict, Any, Literal, Union, Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum
from uuid import UUID

class DegreeLevel(str, Enum):
    PHD = "phd"
    MASTERS = "masters"
    BACHELORS = "bachelors"
    ASSOCIATE = "associate"
    DIPLOMA = "diploma"
    CERTIFICATE = "certificate"

class SkillCategory(str, Enum):
    TECHNICAL = "technical"
    SOFT = "soft"
    LANGUAGE = "language"
    TOOL = "tool"
    DOMAIN = "domain"

class ExperienceLevel(str, Enum):
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    EXECUTIVE = "executive"

class Education(BaseModel):
    degree: str
    field: str
    institution: str
    level: DegreeLevel
    year: Optional[int] = None
    gpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    is_relevant: bool = False
    
    @validator('gpa')
    def validate_gpa(cls, v):
        if v is not None and (v < 0.0 or v > 4.0):
            raise ValueError('GPA must be between 0.0 and 4.0')
        return v

class Skill(BaseModel):
    name: str
    category: SkillCategory
    level: float = Field(ge=0.0, le=1.0)
    years_experience: Optional[float] = None
    required: bool = False
    verified: bool = False

class Experience(BaseModel):
    title: str
    company: str
    start_date: datetime
    end_date: Optional[datetime] = None
    description: Optional[str] = None
    skills: List[str] = []
    level: ExperienceLevel
    is_current: bool = False
    
    @validator('end_date')
    def validate_dates(cls, v, values):
        if v and 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

class EducationMatch(BaseModel):
    match_score: float = Field(ge=0.0, le=1.0)
    level_match: float = Field(ge=0.0, le=1.0)
    field_relevance: float = Field(ge=0.0, le=1.0)
    highest_degree: Optional[Education] = None
    required_education: Optional[Education] = None
    missing_requirements: List[str] = []
    suggestions: List[str] = []

class SkillMatch(BaseModel):
    overall_score: float = Field(ge=0.0, le=1.0)
    matched_skills: List[Skill] = []
    missing_skills: List[Skill] = []
    category_scores: Dict[SkillCategory, float] = Field(
        default_factory=dict,
        description="Scores per skill category"
    )
    suggestions: List[str] = []

class ExperienceMatch(BaseModel):
    years_match: float = Field(ge=0.0, le=1.0)
    level_match: float = Field(ge=0.0, le=1.0)
    relevant_experience: List[Experience] = []
    required_years: float
    actual_years: float
    suggestions: List[str] = []

class RoleMatch(BaseModel):
    title_similarity: float = Field(ge=0.0, le=1.0)
    level_match: float = Field(ge=0.0, le=1.0)
    required_level: ExperienceLevel
    actual_level: ExperienceLevel
    explanation: str
    suggestions: List[str] = []

class MatchDimension(BaseModel):
    name: str
    score: float = Field(ge=0.0, le=1.0)
    weight: float = Field(ge=0.0, le=1.0)
    description: str

class MatchResult(BaseModel):
    overall_score: float = Field(ge=0.0, le=1.0)
    resume_id: str
    job_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    education_match: EducationMatch
    skill_match: SkillMatch
    experience_match: ExperienceMatch
    role_match: RoleMatch
    dimensions: List[MatchDimension]
    suggestions: List[str] = []
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class MatchUpdate(BaseModel):
    type: Literal["resume", "job", "match"]
    id: str
    job_id: Optional[str] = None
    reason: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    affected_keys: List[str] = []

class CacheMetadata(BaseModel):
    created_at: datetime
    ttl: int
    entity_type: Literal["resume", "job", "match"]
    entity_id: str
    version: str = "1.0"
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# WebSocket message schemas
class WSMessageType(str, Enum):
    MATCH_UPDATE = "match_update"
    CACHE_INVALIDATION = "cache_invalidation"
    ERROR = "error"
    PROGRESS = "progress"

class WSMessage(BaseModel):
    type: WSMessageType
    payload: Union[MatchResult, MatchUpdate, Dict[str, Any]]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class MatchStrategy(str, Enum):
    HYBRID = "hybrid"
    KEYWORD = "keyword"
    SEMANTIC = "semantic" 