from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class NormalizedFact(UUIDPKMixin, TimestampMixin, Base):
    """A single vendor-neutral security fact with evidence back-references.

    Evidence (line_start/line_end/snippet) makes every downstream finding
    traceable to the exact configuration source.
    """

    __tablename__ = "normalized_facts"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    configuration_id: Mapped[str] = mapped_column(
        ForeignKey("configurations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(40), index=True)
    field: Mapped[str] = mapped_column(String(160), index=True)
    label: Mapped[str] = mapped_column(String(160))
    value: Mapped[str] = mapped_column(String(500))
    value_type: Mapped[str] = mapped_column(String(20), default="string")
    origin: Mapped[str] = mapped_column(String(20), default="DETERMINISTIC")
    confidence: Mapped[float] = mapped_column(default=1.0)

    # Evidence
    line_start: Mapped[int | None] = mapped_column(Integer)
    line_end: Mapped[int | None] = mapped_column(Integer)
    snippet: Mapped[str | None] = mapped_column(String(500))
