from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class ConfigurationRead(ORMModel):
    id: str
    organization_id: str
    device_id: str | None
    source: str
    file_name: str
    file_type: str
    configuration_version: str | None
    line_count: int
    size_bytes: int
    detected_vendor: str | None
    detected_os: str | None
    detection_confidence: float
    syntax_style: str | None
    parser_status: str
    normalization_status: str
    analysis_status: str
    created_at: datetime


class ConfigurationDetail(ConfigurationRead):
    # Sanitized (secret-masked) content only — never the raw file.
    sanitized_content: str | None = None


class ConnectionTestRequest(BaseModel):
    vendor: str
    hostname: str
    username: str
    credential_reference: str
    port: int = 22


class ConnectionTestResult(BaseModel):
    ok: bool
    message: str


class AnalyzeResponse(BaseModel):
    job_id: str
    status: str
