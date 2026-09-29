from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class Report(UUIDPKMixin, TimestampMixin, Base):
    """Report metadata. Generated artifacts (PDF/Excel) live in Storage."""

    __tablename__ = "reports"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(30), default="DEVICE")
    fmt: Mapped[str] = mapped_column("format", String(10), default="PDF")
    status: Mapped[str] = mapped_column(String(20), default="DRAFT", index=True)
    device_ids: Mapped[list] = mapped_column(default=list)  # JSON
    compliance_score: Mapped[int] = mapped_column(Integer, default=0)
    findings_count: Mapped[int] = mapped_column(Integer, default=0)
    severity_breakdown: Mapped[dict] = mapped_column(default=dict)  # JSON
    storage_path: Mapped[str | None] = mapped_column(String(500))
    preview: Mapped[dict] = mapped_column(default=dict)  # JSON DTO
    generated_by: Mapped[str | None] = mapped_column(String(255))
