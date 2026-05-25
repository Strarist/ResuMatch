"""Pydantic schemas for request validation and response serialization."""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


# === Auth Schemas ===


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    profile_img: str | None = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    profile_img: str | None
    provider: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    message: str
    access_token: str
    user: UserResponse


# === Resume Schemas ===


class ResumeResponse(BaseModel):
    id: str
    filename: str
    skills: list[str] | None
    uploaded_at: datetime | None

    model_config = {"from_attributes": True}


class ResumeListResponse(BaseModel):
    resumes: list[ResumeResponse]


# === Analysis Schemas ===


class AnalyzeRequest(BaseModel):
    resume_id: str
    job_description: str = Field(min_length=10)


class BatchAnalyzeRequest(BaseModel):
    resume_id: str
    job_descriptions: list[str] = Field(max_length=10)
