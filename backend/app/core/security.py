"""Authentication + RBAC primitives.

Two auth modes (configurable, both server-enforced):
  * dev      — a static bearer token maps to the seeded dev user/org. Enables
               fully-offline, independently-testable API access.
  * supabase — validates a Supabase-issued JWT (HS256 via SUPABASE_JWT_SECRET).

Authorization is ALWAYS enforced on the backend. Frontend role hints are never
trusted.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.core.config import settings
from app.core.exceptions import AuthenticationError

# ── Roles (extensible; higher index = more privilege) ───────────
ROLE_VIEWER = "VIEWER"
ROLE_AUDITOR = "AUDITOR"
ROLE_ANALYST = "SECURITY_ANALYST"
ROLE_ADMIN = "ADMIN"

ROLE_ORDER = {ROLE_VIEWER: 0, ROLE_AUDITOR: 1, ROLE_ANALYST: 2, ROLE_ADMIN: 3}
ALL_ROLES = set(ROLE_ORDER)


@dataclass(frozen=True)
class Principal:
    """The authenticated caller, scoped to a single organization."""

    user_id: str
    organization_id: str
    email: str
    role: str

    def has_at_least(self, role: str) -> bool:
        return ROLE_ORDER.get(self.role, -1) >= ROLE_ORDER.get(role, 99)


def decode_supabase_jwt(token: str) -> dict:
    """Validate a Supabase HS256 JWT and return its claims."""
    from jose import JWTError, jwt  # local import keeps startup light

    if not settings.supabase_jwt_secret:
        raise AuthenticationError("Supabase JWT secret is not configured")
    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience=settings.supabase_jwt_audience,
        )
    except JWTError as exc:  # never leak the underlying reason
        raise AuthenticationError("Invalid or expired token") from exc
