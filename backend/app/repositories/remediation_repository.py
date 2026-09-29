from __future__ import annotations

from sqlalchemy import select

from app.models.remediation import Remediation
from app.repositories.base import TenantRepository


class RemediationRepository(TenantRepository[Remediation]):
    model = Remediation

    def get_by_finding(self, org_id: str, finding_id: str) -> Remediation | None:
        stmt = select(Remediation).where(
            Remediation.finding_id == finding_id,
            Remediation.organization_id == org_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()
