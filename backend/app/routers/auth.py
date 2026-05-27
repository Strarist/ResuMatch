"""Auth router — HTTP concerns only. Delegates logic to AuthService."""

from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from starlette.config import Config

from authlib.integrations.starlette_client import OAuth, OAuthError

from app.config import get_settings
from app.core.dependencies import get_db
from app.core.dependencies import get_auth_service, get_current_user, get_user_repo
from app.exceptions import AuthenticationError, ConflictError
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas import LoginRequest, RegisterRequest, ProfileUpdateRequest, UserResponse
from app.services import AuthService

router = APIRouter(prefix="/v1/auth", tags=["Auth"])

settings = get_settings()

# NOTE: CSRF protection relies on SameSite=lax cookies + requiring the Authorization
# header for state-changing requests from JS. For full CSRF protection in production,
# consider adding a double-submit cookie or synchronizer token pattern.

_COOKIE_SECURE = settings.is_production

# OAuth setup
oauth = OAuth()
if settings.google_client_id and settings.google_client_secret:
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
        "user": UserResponse.model_validate(user).model_dump(),
    })
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=_COOKIE_SECURE, samesite="lax")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=_COOKIE_SECURE, samesite="lax")
    return response


@router.post("/register")
async def register(body: RegisterRequest, auth_service: AuthService = Depends(get_auth_service), db=Depends(get_db)):
    try:
        user, access, refresh = await auth_service.register(
            name=body.name, email=body.email, password=body.password
        )
        await db.commit()
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
    response = JSONResponse({"message": "Token refreshed"})
    response.set_cookie(key="access_token", value=access, httponly=True, secure=_COOKIE_SECURE, samesite="lax")
    response.set_cookie(key="refresh_token", value=refresh_tok, httponly=True, secure=_COOKIE_SECURE, samesite="lax")
    return response


@router.post("/logout")
async def logout():
    response = JSONResponse({"message": "Logout successful"})
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return response


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"user": UserResponse.model_validate(current_user).model_dump()}


@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return {"user": UserResponse.model_validate(current_user).model_dump()}


@router.put("/profile")
async def update_profile(
    body: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repo),
    db=Depends(get_db)
):
    user = await user_repo.update(current_user, name=body.name, profile_img=body.profile_img)
    await db.commit()
    return {"message": "Profile updated successfully", "user": UserResponse.model_validate(user).model_dump()}


@router.get("/google/login")
async def google_login(request: Request):
    if not settings.google_client_id or not settings.google_client_secret:
        return JSONResponse(
            status_code=503,
            content={"error": "oauth_not_configured", "detail": "Google OAuth provider is not configured"},
        )
    redirect_uri = settings.google_redirect_uri
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, auth_service: AuthService = Depends(get_auth_service), db=Depends(get_db)):
    if not settings.google_client_id or not settings.google_client_secret:
        return JSONResponse(
            status_code=503,
            content={"error": "oauth_not_configured", "detail": "Google OAuth provider is not configured"},
        )
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error=oauth_failed&detail={e.error}",
        )

    # Extract user info from the id_token claims
    user_info = token.get("userinfo")
    if not user_info:
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error=oauth_failed&detail=no_user_info",
        )

    email = user_info.get("email")
    name = user_info.get("name", email.split("@")[0] if email else "User")
    picture = user_info.get("picture")

    if not email:
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error=oauth_failed&detail=no_email",
        )

    user, access, refresh = await auth_service.oauth_login(
        email=email, name=name, profile_img=picture
    )
    await db.commit()

    # Redirect to frontend dashboard directly (cookie handles auth)
    response = RedirectResponse(url=f"{settings.frontend_url}/dashboard")
    response.set_cookie(key="access_token", value=access, httponly=True, secure=_COOKIE_SECURE, samesite="lax")
    response.set_cookie(key="refresh_token", value=refresh, httponly=True, secure=_COOKIE_SECURE, samesite="lax")
    return response
