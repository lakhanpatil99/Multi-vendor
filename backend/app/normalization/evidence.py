"""Evidence value objects produced by normalization."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class FactData:
    """A normalized fact ready to persist as a NormalizedFact row."""

    field: str
    category: str
    label: str
    value: str
    value_type: str
    origin: str
    confidence: float
    line_start: int
    line_end: int
    snippet: str


@dataclass
class UnknownData:
    snippet: str
    line_start: int
    line_end: int
    hint: str | None
