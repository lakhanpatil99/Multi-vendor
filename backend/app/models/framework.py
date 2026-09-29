from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class Framework(UUIDPKMixin, TimestampMixin, Base):
    """A compliance framework (CIS / NIST / STIG / ISO). Extensible."""

    __tablename__ = "frameworks"

    key: Mapped[str] = mapped_column(String(20), unique=True, index=True)  # CIS/NIST/...
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    version: Mapped[str] = mapped_column(String(40), default="")
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")
