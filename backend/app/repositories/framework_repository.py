from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.compliance_rule import ComplianceRule, FrameworkMapping
from app.models.framework import Framework


class FrameworkRepository:
    """Global (not tenant-scoped) reference data: frameworks + rules."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_frameworks(self) -> list[Framework]:
        return list(self.db.execute(select(Framework)).scalars().all())

    def get_framework(self, key: str) -> Framework | None:
        return self.db.execute(
            select(Framework).where(Framework.key == key)
        ).scalar_one_or_none()

    def list_rules(self, enabled_only: bool = True) -> list[ComplianceRule]:
        stmt = select(ComplianceRule)
        if enabled_only:
            stmt = stmt.where(ComplianceRule.enabled.is_(True))
        return list(self.db.execute(stmt).scalars().all())

    def mappings_for_rule(self, rule_id: str) -> list[FrameworkMapping]:
        return list(
            self.db.execute(
                select(FrameworkMapping).where(FrameworkMapping.rule_id == rule_id)
            ).scalars().all()
        )
