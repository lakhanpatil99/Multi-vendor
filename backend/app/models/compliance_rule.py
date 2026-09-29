from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class ComplianceRule(UUIDPKMixin, TimestampMixin, Base):
    """Declarative, canonical compliance rule.

    Rules are data, not code: the evaluator inspects `target_field` on the
    normalized model using `operator` against `expected_value`. One canonical
    rule maps to many framework controls (see FrameworkMapping).
    """

    __tablename__ = "compliance_rules"

    rule_id: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(40), index=True)
    severity: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    description: Mapped[str | None] = mapped_column(Text)
    target_field: Mapped[str] = mapped_column(String(160))
    operator: Mapped[str] = mapped_column(String(30), default="equals")
    expected_value: Mapped[str | None] = mapped_column(String(200))
    # When a required field is absent, the rule may FAIL or be N/A.
    on_missing: Mapped[str] = mapped_column(String(10), default="FAIL")
    rationale: Mapped[str | None] = mapped_column(Text)
    enabled: Mapped[bool] = mapped_column(default=True)


class FrameworkMapping(UUIDPKMixin, TimestampMixin, Base):
    """Maps a canonical rule to a specific framework control."""

    __tablename__ = "framework_mappings"

    rule_id: Mapped[str] = mapped_column(
        ForeignKey("compliance_rules.rule_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    framework_key: Mapped[str] = mapped_column(String(20), index=True)
    control_id: Mapped[str] = mapped_column(String(60))
    control_title: Mapped[str] = mapped_column(String(255))
    rationale: Mapped[str | None] = mapped_column(Text)


class ComplianceRun(UUIDPKMixin, TimestampMixin, Base):
    """A single compliance evaluation pass over a configuration."""

    __tablename__ = "compliance_runs"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    device_id: Mapped[str] = mapped_column(
        ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True
    )
    configuration_id: Mapped[str] = mapped_column(
        ForeignKey("configurations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    overall_score: Mapped[int] = mapped_column(default=0)
    total_rules: Mapped[int] = mapped_column(default=0)
    passed: Mapped[int] = mapped_column(default=0)
    failed: Mapped[int] = mapped_column(default=0)
    not_applicable: Mapped[int] = mapped_column(default=0)
    unknown: Mapped[int] = mapped_column(default=0)
    framework_scores: Mapped[dict] = mapped_column(default=dict)  # JSON
    category_scores: Mapped[dict] = mapped_column(default=dict)  # JSON {cat:{pass,fail,score}}
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
