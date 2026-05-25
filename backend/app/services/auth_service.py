"""Auth service — handles authentication logic independent of HTTP."""

from datetime import datetime, timedelta

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import get_settings
from app.exceptions import AuthenticationError, ConflictError
from app.models import User
from app.repositories.user_repo import UserRepository

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
        self._settings = get_settings()

    async def register(self, *, name: str, email: str, password: str) -> tuple[User, str, str]:
        """Register a new user. Returns (user, access_token, refresh_token)."""
        existing = await self.user_repo.get_by_email(email)
        if existing:
            raise ConflictError("Email already registered")

        password_hash = pwd_context.hash(password)
        user = await self.user_repo.create(
            name=name, email=email, provider="email", password_hash=password_hash
        )
        return user, self._create_token(user), self._create_token(user, refresh=True)

    async def login(self, *, email: str, password: str) -> tuple[User, str, str]:
        """Authenticate with email/password. Returns (user, access_token, refresh_token)."""
        user = await self.user_repo.get_by_email(email)
        if not user or not user.password_hash:
            raise AuthenticationError("Invalid credentials")
        if not pwd_context.verify(password, user.password_hash):
            raise AuthenticationError("Invalid credentials")
        return user, self._create_token(user), self._create_token(user, refresh=True)

    async def refresh(self, refresh_token: str) -> tuple[str, str]:
        """Validate refresh token, return new token pair."""
        payload = self._decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")
        user = await self.user_repo.get_by_id(int(payload["sub"]))
        if not user:
            raise AuthenticationError("User not found")
        return self._create_token(user), self._create_token(user, refresh=True)

    async def get_current_user(self, token: str) -> User:
        """Validate access token and return the user."""
        payload = self._decode_token(token)
        if payload.get("type") == "refresh":
            raise AuthenticationError("Refresh token not allowed for access")
        user = await self.user_repo.get_by_id(int(payload["sub"]))
        if not user:
            raise AuthenticationError("User not found")
        return user

    async def oauth_login(self, *, email: str, name: str, profile_img: str | None) -> tuple[User, str, str]:
        """Login or register via OAuth. Returns (user, access_token, refresh_token)."""
        user = await self.user_repo.get_by_email(email)
        if not user:
            user = await self.user_repo.create(
                name=name, email=email, provider="google", profile_img=profile_img
            )
        return user, self._create_token(user), self._create_token(user, refresh=True)

    def _create_token(self, user: User, refresh: bool = False) -> str:
        expire_minutes = (
            self._settings.jwt_refresh_expire_minutes if refresh
            else self._settings.jwt_access_expire_minutes
        )
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "provider": user.provider,
            "type": "refresh" if refresh else "access",
            "exp": datetime.utcnow() + timedelta(minutes=expire_minutes),
        }
        return jwt.encode(payload, self._settings.jwt_secret, algorithm=self._settings.jwt_algorithm)

    def _decode_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(
                token, self._settings.jwt_secret, algorithms=[self._settings.jwt_algorithm]
            )
            if not payload.get("sub"):
                raise AuthenticationError("Invalid token payload")
            return payload
        except JWTError:
            raise AuthenticationError("Invalid token")
