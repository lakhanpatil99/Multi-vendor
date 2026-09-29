from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class DeviceCreate(BaseModel):
    hostname: str = Field(min_length=1, max_length=255)
    vendor: str = Field(min_length=1, max_length=60)
    device_type: str = "OTHER"
    model: str | None = None
    serial_number: str | None = None
    os_name: str | None = None
    os_version: str | None = None
    firmware_version: str | None = None
    management_ip: str | None = None
    location: str | None = None


class DeviceUpdate(BaseModel):
    hostname: str | None = None
    vendor: str | None = None
    device_type: str | None = None
    model: str | None = None
    serial_number: str | None = None
    os_name: str | None = None
    os_version: str | None = None
    firmware_version: str | None = None
    management_ip: str | None = None
    location: str | None = None
    status: str | None = None


class DeviceRead(ORMModel):
    id: str
    organization_id: str
    hostname: str
    vendor: str
    device_type: str
    model: str | None
    serial_number: str | None
    os_name: str | None
    os_version: str | None
    firmware_version: str | None
    management_ip: str | None
    location: str | None
    status: str
    compliance_score: int
    risk_level: str
    last_analysis_at: datetime | None
    created_at: datetime
    updated_at: datetime
