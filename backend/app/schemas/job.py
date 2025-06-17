from pydantic import BaseModel, constr, conint
from typing import List, Optional, Dict
from datetime import datetime


class SalaryRange(BaseModel):
    min: conint(gt=0)
    max: conint(gt=0)
    currency: str = "USD"


class JobBase(BaseModel):
    title: constr(min_length=1, max_length=200)
    company: constr(min_length=1, max_length=200)
    description: constr(min_length=1)
    requirements: List[str]
    location: constr(min_length=1, max_length=100)
    type: constr(pattern="^(full-time|part-time|contract|remote)$")
    salary: Optional[SalaryRange] = None


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[constr(min_length=1, max_length=200)] = None
    company: Optional[constr(min_length=1, max_length=200)] = None
    description: Optional[constr(min_length=1)] = None
    requirements: Optional[List[str]] = None
    location: Optional[constr(min_length=1, max_length=100)] = None
    type: Optional[constr(pattern="^(full-time|part-time|contract|remote)$")] = None
    salary: Optional[SalaryRange] = None


class JobInDBBase(JobBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Job(JobInDBBase):
    pass


class JobWithMatches(Job):
    matches: List["JobMatch"] = []


class JobMatch(BaseModel):
    id: str
    job_id: str
    resume_id: str
    score: float
    created_at: datetime

    class Config:
        from_attributes = True


class JobList(BaseModel):
    items: List[Job]
    total: int


class JobAnalysis(BaseModel):
    # TODO: Define actual fields
    summary: str = "Analysis not implemented yet." 