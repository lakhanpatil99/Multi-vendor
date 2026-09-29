from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class FindingRead(ORMModel):
    id: str
    organization_id: str
    device_id: str
    configuration_id: str
    rule_id: str
    title: str
    description: str | None
    category: str
    severity: str
    status: str
    result: str
    actual_value: str | None
    expected_value: str | None
    security_impact: str | None
    risk_score: int
    evidence: dict
    frameworks: list
    verification: list
    detected_at: datetime | None
    created_at: datetime


class FindingUpdate(BaseModel):
    # Allowed lifecycle transitions for a finding.
    status: str  # OPEN/ACKNOWLEDGED/REMEDIATED/FALSE_POSITIVE/ACCEPTED_RISK
