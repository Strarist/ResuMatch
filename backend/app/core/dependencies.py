"""Centralized Dependency Layer."""

from fastapi import Depends, Request, Cookie, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncGenerator

from app.db import get_db as _get_db, async_session_factory, engine
from app.models.user import User
from app.repositories import UserRepository, ResumeRepository, MatchRepository
from app.services import AuthService, ResumeService, AnalysisService
from app.exceptions import AuthenticationError

# Re-export DB components
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in _get_db():
        yield session

# === Repository factories ===

def get_user_repo(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)

def get_resume_repo(db: AsyncSession = Depends(get_db)) -> ResumeRepository:
    return ResumeRepository(db)

def get_match_repo(db: AsyncSession = Depends(get_db)) -> MatchRepository:
    return MatchRepository(db)

# === Service factories ===

def get_auth_service(user_repo: UserRepository = Depends(get_user_repo)) -> AuthService:
    return AuthService(user_repo)

def get_resume_service(resume_repo: ResumeRepository = Depends(get_resume_repo)) -> ResumeService:
    return ResumeService(resume_repo)

def get_analysis_service(
    resume_repo: ResumeRepository = Depends(get_resume_repo),
) -> AnalysisService:
    return AnalysisService(resume_repo)

# === Auth dependency ===

async def get_current_user(
    request: Request,
    access_token: str = Cookie(default=None),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    elif access_token:
        token = access_token

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        return await auth_service.get_current_user(token)
    except AuthenticationError as e:
        raise HTTPException(status_code=401, detail=e.message)
