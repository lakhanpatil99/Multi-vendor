from __future__ import annotations

from sqlalchemy import select

from app.models.configuration import Configuration, NormalizedConfiguration
from app.models.normalized_fact import NormalizedFact
from app.repositories.base import TenantRepository


class ConfigurationRepository(TenantRepository[Configuration]):
    model = Configuration

    def get_normalized(self, org_id: str, config_id: str) -> NormalizedConfiguration | None:
        stmt = select(NormalizedConfiguration).where(
            NormalizedConfiguration.configuration_id == config_id,
            NormalizedConfiguration.organization_id == org_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def facts(self, org_id: str, config_id: str) -> list[NormalizedFact]:
        stmt = select(NormalizedFact).where(
            NormalizedFact.configuration_id == config_id,
            NormalizedFact.organization_id == org_id,
        ).order_by(NormalizedFact.line_start)
        return list(self.db.execute(stmt).scalars().all())

    def clear_analysis(self, org_id: str, config_id: str) -> None:
        """Remove prior normalized data for idempotent re-analysis."""
        for fact in self.facts(org_id, config_id):
            self.db.delete(fact)
        nc = self.get_normalized(org_id, config_id)
        if nc:
            self.db.delete(nc)
        self.db.flush()
