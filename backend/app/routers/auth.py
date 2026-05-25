"""Auth router — HTTP concerns only. Delegates logic to AuthService."""

from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import JSONResponse, Response

from authlib.integrations.starlette_client import OAuth

from app.config import get_settings
from app.dependencies import get_auth_service, get_current_user, get_user_repo
from app.exceptions import AuthenticationError, ConflictError
from app.models import User
from app.repositories.user_repo import UserRepository
from app.schemas import LoginRequest, RegisterRequest, ProfileUpdateRequest, UserResponse
from app.services import AuthService

router = APIRouter(prefix="/v1/auth", tags=["Auth"])

settings = get_settings()

# OAuth setup
oauth = OAuth()
if settings.google_client_id:
    oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


def _auth_response(message: str, access_token: str, refresh_token: str, user: User) -> JSONResponse:
    response = JSONResponse({
        "message": message,
        "access_token": access_token,
        "user": UserResponse.model_validate(user).model_dump(),
    })
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="lax")
    return response


@router.post("/register")
async def register(body: RegisterRequest, auth_service: AuthService = Depends(get_auth_service)):
    try:
        user, access, refresh = await auth_service.register(
            name=body.name, email=body.email, password=body.password
        )
    except ConflictError as e:
        raise HTTPException(status_code=400, detail=e.message)
    return _auth_response("Registration successful", access, refresh, user)


@router.post("/login")
async def login(body: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):
    try:
        user, access, refresh = await auth_service.login(email=body.email, password=body.password)
    except AuthenticationError as e:
        raise HTTPException(status_code=401, detail=e.message)
    return _auth_response("Login successful", access, refresh, user)


@router.post("/refresh")
async def refresh(request: Request, auth_service: AuthService = Depends(get_auth_service)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token required")
    try:
        access, refresh_tok = await auth_service.refresh(token)
    except AuthenticationError as e:
        raise HTTPException(status_code=401, detail=e.message)
    response = JSONResponse({"access_token": access})
    response.set_cookie(key="access_token", value=access, httponly=True, secure=True, samesite="lax")
    response.set_cookie(key="refresh_token", value=refresh_tok, httponly=True, secure=True, samesite="lax")
    return response


@router.post("/logout")
async def logout():
    response = JSONResponse({"message": "Logout successful"})
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return response


@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return {"user": UserResponse.model_validate(current_user).model_dump()}


@router.put("/profile")
async def update_profile(
    body: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repo),
):
    user = await user_repo.update(current_user, name=body.name, profile_img=body.profile_img)
    return {"message": "Profile updated successfully", "user": UserResponse.model_validate(user).model_dump()}


@router.get("/google/login")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(request, settings.oauth_redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, auth_service: AuthService = Depends(get_auth_service)):
    token = await oauth.google.authorize_access_token(request)
    user_info = await oauth.google.parse_id_token(request, token)
    user, access, refresh = await auth_service.oauth_login(
        email=user_info["email"], name=user_info.get("name", ""), profile_img=user_info.get("picture")
    )
    return Response(status_code=302, headers={"Location": f"{settings.frontend_url}/login?token={access}"})
