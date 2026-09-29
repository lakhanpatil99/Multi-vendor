from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class AuditEvent(UUIDPKMixin, TimestampMixin, Base):
    """Immutable audit trail entry. NEVER contains secrets or raw config."""

    __tablename__ = "audit_logs"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(String(60), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    actor: Mapped[str | None] = mapped_column(String(255))
    severity: Mapped[str | None] = mapped_column(String(20))

    device_id: Mapped[str | None] = mapped_column(String(36), index=True)
    configuration_id: Mapped[str | None] = mapped_column(String(36), index=True)
    finding_id: Mapped[str | None] = mapped_column(String(36), index=True)
    report_id: Mapped[str | None] = mapped_column(String(36), index=True)
    pattern_id: Mapped[str | None] = mapped_column(String(36), index=True)
    job_id: Mapped[str | None] = mapped_column(String(36), index=True)
