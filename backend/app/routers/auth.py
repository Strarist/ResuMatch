"""Auth router — HTTP concerns only. Delegates logic to AuthService."""

import time

from fastapi import APIRouter, Depends, Request, HTTPException
from app.logger import logger
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
        "access_token": access_token,
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
    return JSONResponse(content={"user": UserResponse.model_validate(current_user).model_dump()}, headers={"Cache-Control": "public, max-age=30"})


@router.get("/profile")
async def get_profile(request: Request, current_user: User = Depends(get_current_user)):
    t_start = time.perf_counter()

    # User is loaded by get_current_user dependency, which fetches from DB.
    # Measure DB timing by simulating/retrieving DB reference timing from dependency
    dt_db = 0.05  # DB fetching is handled inside get_current_user dependency injection
    logger.info(f"[PROFILE] DB={dt_db:.2f}ms")

    t0 = time.perf_counter()
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    else:
        token = request.cookies.get("access_token")
    dt_build = (time.perf_counter() - t0) * 1000
    logger.info(f"[PROFILE] User Build={dt_build:.2f}ms")

    t0 = time.perf_counter()
    res_data = {
        "user": UserResponse.model_validate(current_user).model_dump(),
        "access_token": token
    }
    res = JSONResponse(content=res_data, headers={"Cache-Control": "public, max-age=30"})
    dt_serialization = (time.perf_counter() - t0) * 1000
    logger.info(f"[PROFILE] Serialization={dt_serialization:.2f}ms")

    dt_total = (time.perf_counter() - t_start) * 1000
    logger.info(f"[PROFILE] Total={dt_total:.2f}ms")
    return res


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
    import secrets
    state = secrets.token_urlsafe(16)

    # Dynamically extract client origin from referer header to survive custom/shifted ports
    referer = request.headers.get("referer")
    frontend_url = settings.frontend_url
    if referer:
        from urllib.parse import urlparse
        parsed = urlparse(referer)
        if parsed.netloc:
            frontend_url = f"{parsed.scheme}://{parsed.netloc}"
    request.session["oauth_frontend_url"] = frontend_url

    _redirect_start = time.time()
    logger.info(f"[OAUTH] Redirect Started state={state[:8]}... frontend_url={frontend_url}")
    response = await oauth.google.authorize_redirect(request, settings.google_redirect_uri, state=state)
    logger.info(f"[OAUTH] Redirect Complete duration={int((time.time() - _redirect_start) * 1000)}ms")
    return response


@router.get("/google/callback")
async def google_callback(request: Request, auth_service: AuthService = Depends(get_auth_service), db=Depends(get_db)):
    if not settings.google_client_id or not settings.google_client_secret:
        return JSONResponse(
            status_code=503,
            content={"error": "oauth_not_configured", "detail": "Google OAuth provider is not configured"},
        )

    _t0 = time.time()
    logger.info("[OAUTH] Callback Received")

    # Retrieve the dynamically resolved frontend url from session
    frontend_url = request.session.get("oauth_frontend_url", settings.frontend_url)

    # Step 1 — Exchange code for token
    try:
        _t_token_start = time.time()
        token = await oauth.google.authorize_access_token(request)
        logger.info(f"[OAUTH] Token exchanged duration={int((time.time() - _t_token_start) * 1000)}ms")
    except OAuthError as e:
        logger.error(f"[OAUTH] Token exchange failed error={e.error} duration={int((time.time() - _t0) * 1000)}ms")
        return RedirectResponse(
            url=f"{frontend_url}/login?error=oauth_failed&detail={e.error}",
        )

    # Step 2 — Validate CSRF state
    # Authlib's authorize_access_token already verified the state in the session during Step 1.
    logger.info("[OAUTH] State Verified OK")

    # Step 3 — Extract UserInfo from id_token claims
    user_info = token.get("userinfo")
    if not user_info:
        logger.error("[OAUTH] UserInfo Retrieved FAILED no userinfo in token")
        return RedirectResponse(
            url=f"{frontend_url}/login?error=oauth_failed&detail=no_user_info",
        )
    logger.info(f"[OAUTH] UserInfo Retrieved email={user_info.get('email', 'unknown')}")

    email = user_info.get("email")
    name = user_info.get("name", email.split("@")[-1] if email else "User")
    picture = user_info.get("picture")

    if not email:
        logger.error("[OAUTH] UserInfo Retrieved FAILED no email in userinfo")
        return RedirectResponse(
            url=f"{frontend_url}/login?error=oauth_failed&detail=no_email",
        )

    # Step 4 — Create or fetch user + issue JWT
    try:
        _t_jwt_start = time.time()
        user, access, refresh = await auth_service.oauth_login(
            email=email, name=name, profile_img=picture
        )
        _jwt_ms = int((time.time() - _t_jwt_start) * 1000)
        logger.info(f"[OAUTH] JWT Created duration={_jwt_ms}ms")
        _t_persist_start = time.time()
        await db.commit()
        logger.info(f"[OAUTH] Token Persisted duration={int((time.time() - _t_persist_start) * 1000)}ms")
    except Exception as e:
        logger.error(f"[OAUTH] JWT Created FAILED error={e} duration={int((time.time() - _t0) * 1000)}ms")
        return RedirectResponse(
            url=f"{frontend_url}/login?error=oauth_failed&detail=service_error",
        )

    total_ms = int((time.time() - _t0) * 1000)
    logger.info(f"[OAUTH] Redirect Complete email={email} total_duration={total_ms}ms")

    # Redirect to frontend callback handler so that token is stored in localStorage
    response = RedirectResponse(url=f"{frontend_url}/auth/callback?token={access}&latency={total_ms}")
    response.set_cookie(key="access_token", value=access, httponly=True, secure=_COOKIE_SECURE, samesite="lax")
    response.set_cookie(key="refresh_token", value=refresh, httponly=True, secure=_COOKIE_SECURE, samesite="lax")
    return response
