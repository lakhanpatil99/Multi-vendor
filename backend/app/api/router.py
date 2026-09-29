"""Aggregate v1 API router."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    analysis,
    audit,
    auth,
    compliance,
    configurations,
    devices,
    findings,
    frameworks,
    health,
    normalization,
    organizations,
    remediation,
    reports,
    training,
)

api_router = APIRouter(prefix="/api/v1")

for module in (
    health,
    auth,
    organizations,
    devices,
    configurations,
    analysis,
    normalization,
    compliance,
    frameworks,
    findings,
    training,
    remediation,
    reports,
    audit,
):
    api_router.include_router(module.router)
