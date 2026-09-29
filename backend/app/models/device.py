from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class Device(UUIDPKMixin, TimestampMixin, Base):
    """A managed network device. Vendor is a dynamic string, never a column."""

    __tablename__ = "devices"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    hostname: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    vendor: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    device_type: Mapped[str] = mapped_column(String(40), default="OTHER")
    model: Mapped[str | None] = mapped_column(String(120))
    serial_number: Mapped[str | None] = mapped_column(String(120))
    os_name: Mapped[str | None] = mapped_column(String(60))
    os_version: Mapped[str | None] = mapped_column(String(60))
    firmware_version: Mapped[str | None] = mapped_column(String(60))
    management_ip: Mapped[str | None] = mapped_column(String(64))
    location: Mapped[str | None] = mapped_column(String(160))
    status: Mapped[str] = mapped_column(String(30), default="PENDING", index=True)
    compliance_score: Mapped[int] = mapped_column(default=0)
    risk_level: Mapped[str] = mapped_column(String(20), default="MINIMAL")
    last_analysis_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class DeviceCredentialRef(UUIDPKMixin, TimestampMixin, Base):
    """A REFERENCE to a credential — never the secret itself.

    Only a pointer (e.g. a vault URI / Supabase secret name) is stored. Live
    collection resolves the actual secret at runtime; it is never persisted in
    this table nor logged.
    """

    __tablename__ = "device_credential_refs"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    device_id: Mapped[str] = mapped_column(
        ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True
    )
    method: Mapped[str] = mapped_column(String(20), default="SSH")
    username: Mapped[str | None] = mapped_column(String(120))
    # Opaque reference only — e.g. "vault://ssh/netops". No plaintext secrets.
    credential_reference: Mapped[str] = mapped_column(String(255), nullable=False)
    port: Mapped[int] = mapped_column(default=22)
