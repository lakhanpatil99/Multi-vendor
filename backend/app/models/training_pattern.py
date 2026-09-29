from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class TrainingPattern(UUIDPKMixin, TimestampMixin, Base):
    """An unfamiliar configuration pattern in the human-in-the-loop pipeline.

    PENDING → APPROVED | REJECTED | DISABLED. Low-confidence AI suggestions are
    NEVER auto-promoted to trusted normalization facts.
    """

    __tablename__ = "training_patterns"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vendor: Mapped[str] = mapped_column(String(60), index=True)
    os: Mapped[str | None] = mapped_column(String(60))
    raw_pattern: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_field: Mapped[str | None] = mapped_column(String(160))
    security_category: Mapped[str | None] = mapped_column(String(40))
    extraction_strategy: Mapped[str | None] = mapped_column(String(60))
    ai_confidence: Mapped[float] = mapped_column(default=0.0)
    human_confidence: Mapped[float | None] = mapped_column()
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)
    usage_count: Mapped[int] = mapped_column(default=0)
    created_by: Mapped[str | None] = mapped_column(String(255))
    approved_by: Mapped[str | None] = mapped_column(String(255))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    review_note: Mapped[str | None] = mapped_column(Text)


class TrainingFeedback(UUIDPKMixin, TimestampMixin, Base):
    """Audit-friendly record of each human decision on a pattern."""

    __tablename__ = "training_feedback"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pattern_id: Mapped[str] = mapped_column(
        ForeignKey("training_patterns.id", ondelete="CASCADE"), nullable=False, index=True
    )
    decision: Mapped[str] = mapped_column(String(20))  # APPROVE/MODIFY/REJECT
    category: Mapped[str | None] = mapped_column(String(40))
    field: Mapped[str | None] = mapped_column(String(160))
    note: Mapped[str | None] = mapped_column(Text)
    actor: Mapped[str | None] = mapped_column(String(255))


class AIAnalysis(UUIDPKMixin, TimestampMixin, Base):
    """Record of an AI interpretation attempt for an unknown pattern."""

    __tablename__ = "ai_analysis"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pattern_id: Mapped[str | None] = mapped_column(
        ForeignKey("training_patterns.id", ondelete="SET NULL"), index=True
    )
    provider: Mapped[str] = mapped_column(String(40), default="local")
    interpretation: Mapped[str | None] = mapped_column(Text)
    suggested_category: Mapped[str | None] = mapped_column(String(40))
    suggested_field: Mapped[str | None] = mapped_column(String(160))
    confidence: Mapped[float] = mapped_column(default=0.0)
    similar_patterns: Mapped[list] = mapped_column(default=list)  # JSON
