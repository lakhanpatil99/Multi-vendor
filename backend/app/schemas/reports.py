from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class ReportCreate(BaseModel):
    title: str
    category: str = "DEVICE"  # DEVICE/COMPLIANCE/FRAMEWORK/FINDING/EXECUTIVE_SUMMARY
    fmt: str = "PDF"          # PDF / EXCEL
    device_ids: list[str] = []


class ReportRead(ORMModel):
    id: str
    organization_id: str
    title: str
    category: str
    fmt: str
    status: str
    device_ids: list
    compliance_score: int
    findings_count: int
    severity_breakdown: dict
    storage_path: str | None
    preview: dict
    generated_by: str | None
    created_at: datetime
