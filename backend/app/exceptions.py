"""Domain exceptions. These are framework-agnostic errors raised by services/repositories.
Routers map these to HTTP responses."""


class AppError(Exception):
    """Base application error."""

    def __init__(self, message: str = "An error occurred"):
        self.message = message
        super().__init__(message)


class NotFoundError(AppError):
    """Resource not found."""

    pass


class ConflictError(AppError):
    """Resource already exists or state conflict."""

    pass


class AuthenticationError(AppError):
    """Authentication failed."""

    pass


class AuthorizationError(AppError):
    """User lacks permission."""

    pass


class ValidationError(AppError):
    """Domain validation failed (not HTTP validation)."""

    pass


class ExternalServiceError(AppError):
    """External service (AI pipeline, file system) failed."""

    pass
