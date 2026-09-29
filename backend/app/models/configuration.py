from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class Configuration(UUIDPKMixin, TimestampMixin, Base):
    """Metadata for an ingested configuration.

    The RAW file lives in Storage (raw_storage_path). Only a SANITIZED
    (secret-masked) representation is kept in the DB for analysis/evidence.
    """

    __tablename__ = "configurations"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    device_id: Mapped[str | None] = mapped_column(
        ForeignKey("devices.id", ondelete="SET NULL"), index=True
    )
    source: Mapped[str] = mapped_column(String(20), default="FILE_UPLOAD")
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), default="CFG")
    configuration_version: Mapped[str | None] = mapped_column(String(60))
    raw_storage_path: Mapped[str | None] = mapped_column(String(500))
    sanitized_content: Mapped[str | None] = mapped_column(Text)
    line_count: Mapped[int] = mapped_column(Integer, default=0)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)

    detected_vendor: Mapped[str | None] = mapped_column(String(60), index=True)
    detected_os: Mapped[str | None] = mapped_column(String(60))
    detection_confidence: Mapped[float] = mapped_column(default=0.0)
    syntax_style: Mapped[str | None] = mapped_column(String(20))

    parser_status: Mapped[str] = mapped_column(String(20), default="PENDING")
    normalization_status: Mapped[str] = mapped_column(String(20), default="PENDING")
    analysis_status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)


class NormalizedConfiguration(UUIDPKMixin, TimestampMixin, Base):
    """The vendor-neutral security model produced from a configuration."""

    __tablename__ = "normalized_configurations"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    configuration_id: Mapped[str] = mapped_column(
        ForeignKey("configurations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    model: Mapped[dict] = mapped_column(default=dict)  # JSON
    schema_version: Mapped[str] = mapped_column(String(20), default="1.0")
