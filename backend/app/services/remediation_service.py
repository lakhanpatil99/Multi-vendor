"""Remediation query + approval service. Execution is DISABLED."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.models.remediation import Remediation
from app.repositories.remediation_repository import RemediationRepository
from app.services.audit_service import AuditService


class RemediationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = RemediationRepository(db)
        self.audit = AuditService(db)

    def list(self, org_id: str, *, filters: dict, offset: int, limit: int):
        return self.repo.list(org_id, filters=filters, offset=offset, limit=limit)

    def get(self, org_id: str, remediation_id: str) -> Remediation:
        rem = self.repo.get(org_id, remediation_id)
        if not rem:
            raise NotFoundError("Remediation not found")
        return rem

    def decide(self, org_id: str, remediation_id: str, decision: str, actor: str) -> Remediation:
        decision = decision.upper()
        if decision not in {"APPROVED", "REJECTED"}:
            raise ValidationError("Invalid decision",
                                  details={"allowed": ["APPROVED", "REJECTED"]})
        rem = self.get(org_id, remediation_id)
        # Approval is recorded conceptually only — NO command is ever executed.
        rem.approval = decision
        rem.status = "APPROVED" if decision == "APPROVED" else "REJECTED"
        self.audit.log(
            organization_id=org_id, event_type="REMEDIATION_GENERATED",
            title=f"Remediation {decision.lower()}", description=rem.title,
            actor=actor, finding_id=rem.finding_id, device_id=rem.device_id,
        )
        self.db.commit()
        self.db.refresh(rem)
        return rem
