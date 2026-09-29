from __future__ import annotations

from datetime import datetime

from app.schemas.common import ORMModel


class AuditEventRead(ORMModel):
    id: str
    organization_id: str
    event_type: str
    title: str
    description: str | None
    actor: str | None
    severity: str | None
    device_id: str | None
    configuration_id: str | None
    finding_id: str | None
    report_id: str | None
    pattern_id: str | None
    job_id: str | None
    created_at: datetime


class JobRead(ORMModel):
    id: str
    organization_id: str
    job_type: str
    resource_type: str
    resource_id: str
    status: str
    progress: int
    current_stage: str | None
    stages: list
    result: dict
    error: str | None
    created_at: datetime
