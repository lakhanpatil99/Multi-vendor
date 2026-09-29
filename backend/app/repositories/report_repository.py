from __future__ import annotations

from app.models.report import Report
from app.repositories.base import TenantRepository


class ReportRepository(TenantRepository[Report]):
    model = Report
