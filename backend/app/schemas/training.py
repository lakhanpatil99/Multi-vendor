from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class TrainingPatternRead(ORMModel):
    id: str
    organization_id: str
    vendor: str
    os: str | None
    raw_pattern: str
    normalized_field: str | None
    security_category: str | None
    extraction_strategy: str | None
    ai_confidence: float
    human_confidence: float | None
    status: str
    usage_count: int
    created_by: str | None
    approved_by: str | None
    reviewed_at: datetime | None
    review_note: str | None
    created_at: datetime


class TrainingReview(BaseModel):
    decision: str  # APPROVE / MODIFY / REJECT
    category: str | None = None
    field: str | None = None
    note: str | None = None


class TrainingPatternUpdate(BaseModel):
    normalized_field: str | None = None
    security_category: str | None = None
    status: str | None = None
