from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class RemediationRead(ORMModel):
    id: str
    organization_id: str
    finding_id: str
    device_id: str
    vendor: str
    os: str | None
    category: str
    severity: str
    title: str
    current_config: str | None
    expected_config: str | None
    commands: list
    verification_steps: list
    rollback_steps: list
    disruptive: bool
    status: str
    approval: str
    created_at: datetime


class RemediationDecision(BaseModel):
    decision: str  # APPROVED / REJECTED
