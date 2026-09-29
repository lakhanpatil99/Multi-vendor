"""Seed reference data + the dev organization/user.

Idempotent. Seeds:
  * frameworks (CIS/NIST/STIG/ISO) from compliance/rules/frameworks.yaml
  * canonical compliance rules + framework mappings from canonical.yaml
  * a dev organization + dev user (dev auth mode)

Run:  python -m scripts.seed
"""
from __future__ import annotations

from sqlalchemy import select

from app.compliance.rule_loader import load_frameworks, load_rules
from app.core.config import settings
from app.db.session import session_scope
from app.models.compliance_rule import ComplianceRule, FrameworkMapping
from app.models.framework import Framework
from app.models.organization import Organization, User


def seed() -> None:
    with session_scope() as db:
        # ── Frameworks ──
        for fw in load_frameworks():
            exists = db.execute(
                select(Framework).where(Framework.key == fw.key)
            ).scalar_one_or_none()
            if not exists:
                db.add(Framework(key=fw.key, name=fw.name, version=fw.version,
                                 description=fw.description, status="ACTIVE"))

        # ── Rules + mappings ──
        for rule in load_rules():
            exists = db.execute(
                select(ComplianceRule).where(ComplianceRule.rule_id == rule.rule_id)
            ).scalar_one_or_none()
            if not exists:
                db.add(ComplianceRule(
                    rule_id=rule.rule_id, title=rule.title, category=rule.category,
                    severity=rule.severity, description=rule.description,
                    target_field=rule.target_field, operator=rule.operator,
                    expected_value=rule.expected_value, on_missing=rule.on_missing,
                    rationale=rule.security_impact, enabled=True,
                ))
                for m in rule.mappings:
                    db.add(FrameworkMapping(
                        rule_id=rule.rule_id, framework_key=m.framework,
                        control_id=m.control_id, control_title=m.control_title,
                    ))

        # ── Dev organization + user (dev auth) ──
        org = db.execute(
            select(Organization).where(Organization.slug == settings.dev_org_slug)
        ).scalar_one_or_none()
        if not org:
            org = Organization(name="Acme NetOps", slug=settings.dev_org_slug)
            db.add(org)
            db.flush()
        user = db.execute(
            select(User).where(
                User.organization_id == org.id, User.email == settings.dev_user_email
            )
        ).scalar_one_or_none()
        if not user:
            db.add(User(
                organization_id=org.id, email=settings.dev_user_email,
                full_name="Dev Analyst", role=settings.dev_user_role,
            ))

    print("Seed complete.")


if __name__ == "__main__":
    seed()
