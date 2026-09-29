"""FastAPI dependencies: auth resolution, RBAC guards, rate limiting, paging."""
from __future__ import annotations

import time
from collections import defaultdict
from dataclasses import dataclass

from fastapi import Depends, Header, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AuthenticationError, AuthorizationError, RateLimitError
from app.core.security import Principal, decode_supabase_jwt
from app.db.session import get_db
from app.models.organization import Organization, User


def _principal_from_user(user: User) -> Principal:
    return Principal(
        user_id=user.id,
        organization_id=user.organization_id,
        email=user.email,
        role=user.role,
    )


def get_current_principal(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Principal:
    """Resolve the authenticated principal from the Authorization header.

    Authorization is always verified against a real DB user, so a token can
    never grant access to an organization the user does not belong to.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthenticationError("Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()

    if settings.auth_mode == "dev":
        return _resolve_dev(token, db)
    return _resolve_supabase(token, db)


def _resolve_dev(token: str, db: Session) -> Principal:
    # Default seeded principal.
    if token == settings.dev_api_token:
        user = db.execute(
            select(User)
            .join(Organization, Organization.id == User.organization_id)
            .where(
                Organization.slug == settings.dev_org_slug,
                User.email == settings.dev_user_email,
            )
        ).scalar_one_or_none()
        if not user:
            raise AuthenticationError("Dev user not seeded; run scripts/seed.py")
        return _principal_from_user(user)
    # Impersonate a specific seeded user (multi-tenant testing): "dev:<user_id>"
    if token.startswith("dev:"):
        user = db.get(User, token[4:])
        if not user:
            raise AuthenticationError("Unknown dev principal")
        return _principal_from_user(user)
    raise AuthenticationError("Invalid dev token")


def _resolve_supabase(token: str, db: Session) -> Principal:
    claims = decode_supabase_jwt(token)
    subject = claims.get("sub")
    email = claims.get("email")
    user = None
    if subject:
        user = db.execute(
            select(User).where(User.auth_subject == subject)
        ).scalar_one_or_none()
    if not user and email:
        user = db.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()
    if not user:
        raise AuthenticationError("No provisioned profile for this identity")
    return _principal_from_user(user)


def require_roles(*roles: str):
    """Dependency factory enforcing the caller holds at least one given role
    (by privilege level). Enforced server-side regardless of the client."""

    def _guard(principal: Principal = Depends(get_current_principal)) -> Principal:
        if not roles:
            return principal
        if any(principal.has_at_least(r) for r in roles):
            return principal
        raise AuthorizationError(
            f"Requires one of roles: {', '.join(sorted(roles))}"
        )

    return _guard


# ── Rate limiting (in-memory sliding window; single-process) ────
# Documented limits from settings. For multi-process, swap for Redis in Phase 4.
_buckets: dict[str, list[float]] = defaultdict(list)


class RateLimit:
    """Dependency enforcing a per-principal (or per-IP) request budget."""

    def __init__(self, key: str = "default") -> None:
        self.key = key
        self.count, self.window = settings.rate_limit(key)

    def __call__(self, request: Request) -> None:
        who = getattr(request.client, "host", "anon") if request.client else "anon"
        bucket_key = f"{self.key}:{who}"
        now = time.time()
        hits = [t for t in _buckets[bucket_key] if now - t < self.window]
        if len(hits) >= self.count:
            raise RateLimitError(
                f"Rate limit exceeded for '{self.key}' "
                f"({self.count}/{self.window}s)"
            )
        hits.append(now)
        _buckets[bucket_key] = hits


@dataclass
class Pagination:
    page: int
    page_size: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def pagination_params(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> Pagination:
    return Pagination(page=page, page_size=page_size)
