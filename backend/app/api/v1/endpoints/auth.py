from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from starlette.responses import RedirectResponse, JSONResponse
from authlib.integrations.starlette_client import OAuth
import os
import secrets
from starlette.requests import Request
import logging
import traceback

from app.api.deps import get_current_active_user, authenticate_user
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate, Token
from app.crud import get_user_by_email

logging.warning('auth.py imported and endpoints registering...')

router = APIRouter()

# OAuth setup
OAUTH_CLIENT_ID_GOOGLE = os.getenv('GOOGLE_CLIENT_ID', 'TODO-SET-GOOGLE-CLIENT-ID')
OAUTH_CLIENT_SECRET_GOOGLE = os.getenv('GOOGLE_CLIENT_SECRET', 'TODO-SET-GOOGLE-CLIENT-SECRET')
OAUTH_CLIENT_ID_GITHUB = os.getenv('GITHUB_CLIENT_ID', 'TODO-SET-GITHUB-CLIENT-ID')
OAUTH_CLIENT_SECRET_GITHUB = os.getenv('GITHUB_CLIENT_SECRET', 'TODO-SET-GITHUB-CLIENT-SECRET')

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

def get_oauth():
    oauth = OAuth()
    oauth.register(
        name='google',
        client_id=OAUTH_CLIENT_ID_GOOGLE,
        client_secret=OAUTH_CLIENT_SECRET_GOOGLE,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'},
    )
    oauth.register(
        name='github',
        client_id=OAUTH_CLIENT_ID_GITHUB,
        client_secret=OAUTH_CLIENT_SECRET_GITHUB,
        access_token_url='https://github.com/login/oauth/access_token',
        access_token_params=None,
        authorize_url='https://github.com/login/oauth/authorize',
        authorize_params=None,
        api_base_url='https://api.github.com/',
        client_kwargs={'scope': 'user:email'},
    )
    return oauth

@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(user.id, expires_delta=access_token_expires)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }
    }


@router.post("/register", response_model=Token)
def register(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Register new user
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system",
        )
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(user.id, expires_delta=access_token_expires)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }
    }


@router.get("/me", response_model=UserSchema)
def read_users_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get current user
    """
    return current_user 

@router.get('/google/login')
async def google_login(request: Request):
    oauth = get_oauth()
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get('/google/callback')
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        print("[Google Callback] Starting callback handler")
        print(f"[Google Callback Debug] FRONTEND_URL value: {FRONTEND_URL}")
        
        code = request.query_params.get('code')
        state = request.query_params.get('state')
        print(f"[Google Callback] Code: {code}, State: {state}")
        
        oauth = get_oauth()
        try:
            token = await oauth.google.authorize_access_token(request)
            print(f"[Google Callback] Token: {token}")
            
            user_info = token.get('userinfo')
            if not user_info:
                print("[Google Callback Debug] No userinfo in token")
                return RedirectResponse(f"{FRONTEND_URL}/login?error=NoUserInfo")
            
            email = user_info.get('email')
            print(f"[Google Callback Debug] Email from userinfo: {email}")
            
            if not email:
                print("[Google Callback Debug] No email found, redirecting to error")
                redirect_url = f"{FRONTEND_URL}/login?error=NoEmail"
                print(f"[Google Callback Debug] Redirect URL for no email: {redirect_url}")
                return RedirectResponse(redirect_url)
            
            user = get_user_by_email(db, email)
            if not user:
                print(f"[Google Callback Debug] Creating new user for email: {email}")
                # Create user with random password
                user = User(
                    email=email,
                    full_name=user_info.get('name') or email.split('@')[0],
                    hashed_password=get_password_hash(secrets.token_urlsafe(16)),
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            
            access_token = create_access_token(user.id)
            redirect_url = f"{FRONTEND_URL}/login?token={access_token}"
            print(f"[Google Callback Debug] Final redirect URL: {redirect_url}")
            return RedirectResponse(redirect_url)
            
        except Exception as e:
            print(f"[Google Callback] OAuth error: {str(e)}")
            print(f"[Google Callback Debug] Error traceback: {traceback.format_exc()}")
            return RedirectResponse(f"{FRONTEND_URL}/login?error=AuthError")
            
    except Exception as e:
        print(f"[Google Callback] Unexpected error: {str(e)}")
        print(f"[Google Callback Debug] Error traceback: {traceback.format_exc()}")
        return RedirectResponse(f"{FRONTEND_URL}/login?error=UnexpectedError")

@router.get('/github/login')
async def github_login(request: Request):
    oauth = get_oauth()
    redirect_uri = request.url_for('github_callback')
    return await oauth.github.authorize_redirect(request, redirect_uri)

@router.get('/github/callback')
async def github_callback(request: Request, db: Session = Depends(get_db)):
    oauth = get_oauth()
    token = await oauth.github.authorize_access_token(request)
    resp = await oauth.github.get('user', token=token)
    profile = resp.json()
    email = profile.get('email')
    full_name = profile.get('name') or profile.get('login')
    if not email:
        # Try to get primary email from /user/emails endpoint
        emails_resp = await oauth.github.get('user/emails', token=token)
        emails = emails_resp.json()
        primary_email = next((e['email'] for e in emails if e.get('primary')), None)
        email = primary_email or (emails[0]['email'] if emails else None)
    if not email:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=NoEmail")
    user = get_user_by_email(db, email)
    if not user:
        user = User(
            email=email,
            full_name=full_name or email.split('@')[0],
            hashed_password=get_password_hash(secrets.token_urlsafe(16)),
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    access_token = create_access_token(user.id)
    return RedirectResponse(f"{FRONTEND_URL}/login?token={access_token}")

@router.get('/test')
def test_endpoint():
    return {'message': 'Test endpoint is working!'} 