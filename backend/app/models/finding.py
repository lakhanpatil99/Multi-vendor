from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class Finding(UUIDPKMixin, TimestampMixin, Base):
    """Canonical, evidence-backed finding.

    Framework references live in `frameworks` (JSON list of mappings) so ONE
    finding correlates to MANY frameworks without duplication.
    """

    __tablename__ = "findings"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    device_id: Mapped[str] = mapped_column(
        ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True
    )
    configuration_id: Mapped[str] = mapped_column(
        ForeignKey("configurations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    run_id: Mapped[str | None] = mapped_column(
        ForeignKey("compliance_runs.id", ondelete="SET NULL"), index=True
    )
    rule_id: Mapped[str] = mapped_column(String(60), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(40), index=True)
    severity: Mapped[str] = mapped_column(String(20), index=True)
    status: Mapped[str] = mapped_column(String(20), default="OPEN", index=True)
    result: Mapped[str] = mapped_column(String(10), default="FAIL")  # PASS/FAIL/N-A/UNKNOWN
    actual_value: Mapped[str | None] = mapped_column(String(500))
    expected_value: Mapped[str | None] = mapped_column(String(500))
    security_impact: Mapped[str | None] = mapped_column(Text)
    risk_score: Mapped[int] = mapped_column(default=0)

    # Evidence (denormalized for fast reads; source of truth is NormalizedFact)
    evidence: Mapped[dict] = mapped_column(default=dict)  # JSON
    frameworks: Mapped[list] = mapped_column(default=list)  # JSON list of mappings
    verification: Mapped[list] = mapped_column(default=list)  # JSON list of steps

    detected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
