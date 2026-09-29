from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class Remediation(UUIDPKMixin, TimestampMixin, Base):
    """Vendor-aware remediation for a finding. Execution stays DISABLED."""

    __tablename__ = "remediations"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    finding_id: Mapped[str] = mapped_column(
        ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    device_id: Mapped[str] = mapped_column(
        ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vendor: Mapped[str] = mapped_column(String(60), index=True)
    os: Mapped[str | None] = mapped_column(String(60))
    category: Mapped[str] = mapped_column(String(40))
    severity: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(200))
    current_config: Mapped[str | None] = mapped_column(Text)
    expected_config: Mapped[str | None] = mapped_column(Text)
    commands: Mapped[list] = mapped_column(default=list)  # JSON
    verification_steps: Mapped[list] = mapped_column(default=list)  # JSON
    rollback_steps: Mapped[list] = mapped_column(default=list)  # JSON
    disruptive: Mapped[bool] = mapped_column(default=False)
    status: Mapped[str] = mapped_column(String(20), default="GENERATED", index=True)
    approval: Mapped[str] = mapped_column(String(20), default="PENDING")
