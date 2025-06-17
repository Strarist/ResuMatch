from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from uuid import UUID


class SalaryRange(BaseModel):
    min: int = Field(..., gt=0, description="Minimum salary")
    max: int = Field(..., gt=0, description="Maximum salary")
    currency: str = Field(default="USD", description="Salary currency")


class JobBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Job title")
    company: str = Field(..., min_length=1, max_length=200, description="Company name")
    description: str = Field(..., min_length=1, description="Job description")
    requirements: List[str] = Field(default_factory=list, description="Job requirements")
    location: str = Field(..., min_length=1, max_length=100, description="Job location")
    type: str = Field(..., pattern="^(full-time|part-time|contract|remote)$", description="Job type")
    salary: Optional[SalaryRange] = Field(None, description="Salary range")


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Job title")
    company: Optional[str] = Field(None, min_length=1, max_length=200, description="Company name")
    description: Optional[str] = Field(None, min_length=1, description="Job description")
    requirements: Optional[List[str]] = Field(None, description="Job requirements")
    location: Optional[str] = Field(None, min_length=1, max_length=100, description="Job location")
    type: Optional[str] = Field(None, pattern="^(full-time|part-time|contract|remote)$", description="Job type")
    salary: Optional[SalaryRange] = Field(None, description="Salary range")


class JobInDBBase(JobBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Job(JobInDBBase):
    pass


class JobWithMatches(Job):
    matches: List["JobMatch"] = []


class JobMatch(BaseModel):
    id: UUID
    job_id: UUID
    resume_id: UUID
    score: float
    created_at: datetime

    class Config:
        from_attributes = True


class JobList(BaseModel):
    items: List[Job]
    total: int


class JobAnalysis(BaseModel):
    summary: str = Field(default="Analysis not implemented yet.", description="Job analysis summary") 