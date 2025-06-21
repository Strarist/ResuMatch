from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import json
from uuid import UUID

class ResumeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Resume title")
    content: Optional[str] = Field('', min_length=0, description="Resume content")
    skills: List[str] = Field(default_factory=list, description="List of skills")
    experience: Dict[str, Any] = Field(default_factory=dict, description="Experience information")
    education: List[str] = Field(default_factory=list, description="Education information")
    file_path: Optional[str] = None
    analysis: Dict[str, float] = Field(default_factory=dict)

class ResumeCreate(ResumeBase):
    pass

class ResumeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Resume title")
    content: Optional[str] = Field(None, min_length=0, description="Resume content")
    skills: Optional[List[str]] = Field(None, description="List of skills")
    experience: Optional[Dict[str, Any]] = Field(None, description="Experience information")
    education: Optional[List[str]] = Field(None, description="Education information")
    file_path: Optional[str] = None

class ResumeAnalysis(BaseModel):
    skills_count: int = 0
    experience_years: int = 0
    education_level: int = 0
    content_length: int = 0

class ResumeResponse(BaseModel):
    id: str
    status: str
    message: str

class ResumeMatch(BaseModel):
    job_id: int
    match_score: float = Field(..., ge=0, le=1)
    matching_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    improvement_suggestions: List[str] = Field(default_factory=list)
    analysis: Dict[str, float] = Field(default_factory=dict)

class ResumeInDBBase(ResumeBase):
    id: UUID
    user_id: int
    match_score: Optional[float] = None
    status: str = "ready"
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
    
    @field_validator('skills', mode='before')
    @classmethod
    def skills_to_list(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            return [skill.strip() for skill in v.split(',') if skill.strip()]
        if isinstance(v, list):
            return v
        return []

    @field_validator('experience', mode='before')
    @classmethod
    def experience_to_dict(cls, v: Any) -> Dict[str, Any]:
        if isinstance(v, dict):
            return v
        if isinstance(v, str):
            try:
                data = json.loads(v)
                return data if isinstance(data, dict) else {}
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}

    @field_validator('education', mode='before')
    @classmethod
    def education_to_list(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            return [edu.strip() for edu in v.split(',') if edu.strip()]
        if isinstance(v, list):
            return v
        return []

class Resume(ResumeInDBBase):
    pass

class ResumeWithMatches(Resume):
    matches: List[ResumeMatch] = Field(default_factory=list)

class ResumeList(BaseModel):
    items: List[Resume]
    total: int

class ResumeAnalysisResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: str 