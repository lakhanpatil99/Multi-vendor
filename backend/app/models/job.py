from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class AnalysisJob(UUIDPKMixin, TimestampMixin, Base):
    """Tracks a long-running pipeline execution.

    QUEUED → RUNNING → COMPLETED | FAILED | CANCELLED.
    """

    __tablename__ = "analysis_jobs"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_type: Mapped[str] = mapped_column(String(40), default="ANALYSIS")
    resource_type: Mapped[str] = mapped_column(String(40), default="configuration")
    resource_id: Mapped[str] = mapped_column(String(36), index=True)
    status: Mapped[str] = mapped_column(String(20), default="QUEUED", index=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    current_stage: Mapped[str | None] = mapped_column(String(60))
    stages: Mapped[list] = mapped_column(default=list)  # JSON list of stage states
    result: Mapped[dict] = mapped_column(default=dict)  # JSON summary
    error: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
