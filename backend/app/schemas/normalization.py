from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import ORMModel


class EvidenceRef(BaseModel):
    configuration_id: str | None = None
    line_start: int | None = None
    line_end: int | None = None
    snippet: str | None = None


class NormalizedFactRead(ORMModel):
    id: str
    configuration_id: str
    category: str
    field: str
    label: str
    value: str
    value_type: str
    origin: str
    confidence: float
    line_start: int | None
    line_end: int | None
    snippet: str | None


class NormalizedModelRead(BaseModel):
    configuration_id: str
    schema_version: str
    model: dict
    facts: list[NormalizedFactRead] = []
