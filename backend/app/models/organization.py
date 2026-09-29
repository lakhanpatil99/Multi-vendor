from __future__ import annotations

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class Organization(UUIDPKMixin, TimestampMixin, Base):
    """Tenant boundary. Every org-owned resource references organization_id."""

    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)

    users: Mapped[list["User"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )


class User(UUIDPKMixin, TimestampMixin, Base):
    """Profile metadata for an authenticated principal.

    Credentials/passwords live in Supabase Auth, never here. `auth_subject`
    holds the external auth subject (Supabase user id) for linkage.
    """

    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("organization_id", "email", name="uq_user_org_email"),
    )

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(200))
    # RBAC role. Extensible; enforced server-side, never trusted from client.
    role: Mapped[str] = mapped_column(String(40), nullable=False, default="VIEWER")
    auth_subject: Mapped[str | None] = mapped_column(String(255), index=True)

    organization: Mapped[Organization] = relationship(back_populates="users")
