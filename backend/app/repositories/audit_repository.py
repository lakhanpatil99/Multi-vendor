from __future__ import annotations

from app.models.audit_event import AuditEvent
from app.models.job import AnalysisJob
from app.repositories.base import TenantRepository


class AuditRepository(TenantRepository[AuditEvent]):
    model = AuditEvent


class JobRepository(TenantRepository[AnalysisJob]):
    model = AnalysisJob
