"""Application-level exceptions mapped to clean HTTP responses.

Internal exception detail is never leaked to clients; each maps to a stable
error `code`, an HTTP status, and a safe message.
"""
from __future__ import annotations

from typing import Any


class AppError(Exception):
    """Base class for all domain/application errors."""

    code: str = "app_error"
    status_code: int = 400
    message: str = "Application error"

    def __init__(
        self,
        message: str | None = None,
        *,
        details: dict[str, Any] | None = None,
        code: str | None = None,
        status_code: int | None = None,
    ) -> None:
        self.message = message or self.message
        self.details = details or {}
        if code:
            self.code = code
        if status_code:
            self.status_code = status_code
        super().__init__(self.message)


class ValidationError(AppError):
    code = "validation_error"
    status_code = 422
    message = "Request validation failed"


class NotFoundError(AppError):
    code = "not_found"
    status_code = 404
    message = "Resource not found"


class AuthenticationError(AppError):
    code = "authentication_error"
    status_code = 401
    message = "Authentication required"


class AuthorizationError(AppError):
    code = "authorization_error"
    status_code = 403
    message = "Not authorized for this action"


class ConflictError(AppError):
    code = "conflict"
    status_code = 409
    message = "Resource conflict"


class RateLimitError(AppError):
    code = "rate_limited"
    status_code = 429
    message = "Too many requests"


class ParsingError(AppError):
    code = "parsing_error"
    status_code = 422
    message = "Configuration parsing failed"


class NormalizationError(AppError):
    code = "normalization_error"
    status_code = 422
    message = "Normalization failed"


class ComplianceError(AppError):
    code = "compliance_error"
    status_code = 500
    message = "Compliance evaluation failed"


class StorageError(AppError):
    code = "storage_error"
    status_code = 502
    message = "Storage backend error"


class AIProviderError(AppError):
    code = "ai_provider_error"
    status_code = 502
    message = "AI provider error"


class JobError(AppError):
    code = "job_error"
    status_code = 500
    message = "Job processing error"
