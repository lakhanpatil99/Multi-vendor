from __future__ import annotations

from sqlalchemy import select

from app.models.finding import Finding
from app.repositories.base import TenantRepository


class FindingRepository(TenantRepository[Finding]):
    model = Finding

    def delete_for_configuration(self, org_id: str, config_id: str) -> None:
        stmt = select(Finding).where(
            Finding.configuration_id == config_id,
            Finding.organization_id == org_id,
        )
        for finding in self.db.execute(stmt).scalars().all():
            self.db.delete(finding)
        self.db.flush()
