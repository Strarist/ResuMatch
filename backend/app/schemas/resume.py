from pydantic import BaseModel, Field, constr
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class ResumeBase(BaseModel):
    title: constr(min_length=1, max_length=200)
    content: Optional[str] = None
    skills: Optional[List[str]] = Field(default_factory=list)
    experience: Optional[Dict[str, Any]] = None
    education: Optional[List[str]] = Field(default_factory=list)
    file_path: Optional[str] = None

class ResumeCreate(ResumeBase):
    pass

class ResumeUpdate(BaseModel):
    title: Optional[constr(min_length=1, max_length=200)] = None
    content: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[Dict[str, Any]] = None
    education: Optional[List[str]] = None
    file_path: Optional[str] = None

class ResumeAnalysis(BaseModel):
    skills_count: int = 0
    experience_years: int = 0
    education_level: int = 0
    content_length: int = 0

class ResumeResponse(ResumeBase):
    id: UUID
    user_id: UUID
    file_url: str
    file_name: str
    file_size: int
    file_type: str
    analysis: Optional[ResumeAnalysis] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ResumeMatch(BaseModel):
    job_id: UUID
    match_score: float = Field(..., ge=0, le=1)
    matching_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    improvement_suggestions: List[str] = Field(default_factory=list)
    analysis: Dict[str, float] = Field(default_factory=dict)

class ResumeInDBBase(ResumeBase):
    id: str
    user_id: str
    match_score: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Resume(ResumeInDBBase):
    pass

class ResumeWithMatches(Resume):
    matches: List[ResumeMatch] = Field(default_factory=list)

class ResumeList(BaseModel):
    items: List[ResumeResponse]
    total: int 