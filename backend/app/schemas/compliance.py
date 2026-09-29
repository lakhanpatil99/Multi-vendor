from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import ORMModel


class FrameworkRead(ORMModel):
    id: str
    key: str
    name: str
    version: str
    description: str | None
    status: str


class FrameworkMappingRead(ORMModel):
    framework_key: str
    control_id: str
    control_title: str
    rationale: str | None = None


class ComplianceRuleRead(ORMModel):
    id: str
    rule_id: str
    title: str
    category: str
    severity: str
    target_field: str
    operator: str
    expected_value: str | None
    enabled: bool


class FrameworkScore(BaseModel):
    framework: str
    score: int
    passed: int
    failed: int


class ComplianceOverview(BaseModel):
    overall_score: int
    status_breakdown: dict[str, int]
    frameworks: list[FrameworkScore]
    categories: list[dict]
