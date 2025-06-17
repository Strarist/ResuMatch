from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class ResumeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Resume title")
    content: str = Field(..., min_length=1, description="Resume content")
    skills: List[str] = Field(default_factory=list, description="List of skills")
    experience: Dict[str, Any] = Field(default_factory=dict, description="Experience information")
    education: List[str] = Field(default_factory=list, description="Education information")
    file_path: Optional[str] = None

class ResumeCreate(ResumeBase):
    pass

class ResumeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Resume title")
    content: Optional[str] = Field(None, min_length=1, description="Resume content")
    skills: Optional[List[str]] = Field(None, description="List of skills")
    experience: Optional[Dict[str, Any]] = Field(None, description="Experience information")
    education: Optional[List[str]] = Field(None, description="Education information")
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
    id: UUID
    user_id: UUID
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
    page: int
    size: int
    pages: int

class ResumeAnalysisResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: str 