"""OAuth provider registry — extensible architecture for multiple OAuth providers."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from authlib.integrations.starlette_client import OAuth

from app.config import get_settings


@dataclass(frozen=True)
class OAuthUserInfo:
    """Typed contract for user info extracted from any OAuth provider."""
    email: str
    name: str
    picture: str | None = None
    provider: str = "unknown"


class OAuthProvider(ABC):
    """Base class for OAuth providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider identifier (e.g., 'google', 'github')."""
        ...

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """Whether this provider has valid credentials."""
        ...

    @abstractmethod
    def register(self, oauth: OAuth) -> None:
        """Register this provider with the OAuth client."""
        ...

    @abstractmethod
    def extract_user_info(self, token: dict[str, Any]) -> OAuthUserInfo:
        """Extract standardized user info from provider token response."""
        ...


class GoogleProvider(OAuthProvider):
    name = "google"

    def __init__(self):
        self._settings = get_settings()

    @property
    def is_configured(self) -> bool:
        return bool(self._settings.google_client_id and self._settings.google_client_secret)

    def register(self, oauth: OAuth) -> None:
        if not self.is_configured:
            return
        oauth.register(
            name="google",
            client_id=self._settings.google_client_id,
            client_secret=self._settings.google_client_secret,
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )

    def extract_user_info(self, token: dict[str, Any]) -> OAuthUserInfo:
        userinfo = token.get("userinfo", {})
        email = userinfo.get("email", "")
        return OAuthUserInfo(
            email=email,
            name=userinfo.get("name", email.split("@")[0] if email else "User"),
            picture=userinfo.get("picture"),
            provider="google",
        )


class GitHubProvider(OAuthProvider):
    """GitHub OAuth — placeholder for future implementation."""
    name = "github"

    @property
    def is_configured(self) -> bool:
        return False  # Not yet configured

    def register(self, oauth: OAuth) -> None:
        pass

    def extract_user_info(self, token: dict[str, Any]) -> OAuthUserInfo:
        raise NotImplementedError("GitHub OAuth not yet implemented")


class LinkedInProvider(OAuthProvider):
    """LinkedIn OAuth — placeholder for future implementation."""
    name = "linkedin"

    @property
    def is_configured(self) -> bool:
        return False

    def register(self, oauth: OAuth) -> None:
        pass

    def extract_user_info(self, token: dict[str, Any]) -> OAuthUserInfo:
        raise NotImplementedError("LinkedIn OAuth not yet implemented")


class MicrosoftProvider(OAuthProvider):
    """Microsoft/Azure AD OAuth — placeholder for future implementation."""
    name = "microsoft"

    @property
    def is_configured(self) -> bool:
        return False

    def register(self, oauth: OAuth) -> None:
        pass

    def extract_user_info(self, token: dict[str, Any]) -> OAuthUserInfo:
        raise NotImplementedError("Microsoft OAuth not yet implemented")


class OAuthRegistry:
    """Registry of all available OAuth providers."""

    def __init__(self):
        self._providers: dict[str, OAuthProvider] = {}

    def register(self, provider: OAuthProvider) -> None:
        self._providers[provider.name] = provider

    def get(self, name: str) -> OAuthProvider | None:
        return self._providers.get(name)

    @property
    def configured_providers(self) -> list[str]:
        return [name for name, p in self._providers.items() if p.is_configured]

    @property
    def all_providers(self) -> list[str]:
        return list(self._providers.keys())


def create_oauth_registry() -> tuple[OAuth, OAuthRegistry]:
    """Initialize OAuth client and register all providers."""
    oauth = OAuth()
    registry = OAuthRegistry()

    providers = [GoogleProvider(), GitHubProvider(), LinkedInProvider(), MicrosoftProvider()]
    for provider in providers:
        registry.register(provider)
        provider.register(oauth)

    return oauth, registry
