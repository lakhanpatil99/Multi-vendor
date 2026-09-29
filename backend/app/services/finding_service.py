"""Finding query + lifecycle service."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.models.finding import Finding
from app.repositories.finding_repository import FindingRepository
from app.services.audit_service import AuditService

_ALLOWED_STATUS = {"OPEN", "ACKNOWLEDGED", "REMEDIATED", "FALSE_POSITIVE", "ACCEPTED_RISK"}


class FindingService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = FindingRepository(db)
        self.audit = AuditService(db)

    def list(self, org_id: str, *, filters: dict, offset: int, limit: int):
        return self.repo.list(org_id, filters=filters, offset=offset, limit=limit)

    def get(self, org_id: str, finding_id: str) -> Finding:
        finding = self.repo.get(org_id, finding_id)
        if not finding:
            raise NotFoundError("Finding not found")
        return finding

    def update_status(self, org_id: str, finding_id: str, status: str, actor: str) -> Finding:
        if status not in _ALLOWED_STATUS:
            raise ValidationError("Invalid finding status",
                                  details={"allowed": sorted(_ALLOWED_STATUS)})
        finding = self.get(org_id, finding_id)
        finding.status = status
        if status in {"REMEDIATED", "FALSE_POSITIVE", "ACCEPTED_RISK"}:
            finding.resolved_at = datetime.now(timezone.utc)
        self.audit.log(
            organization_id=org_id, event_type="FINDING_CREATED",
            title="Finding status updated", description=f"{finding.title} -> {status}",
            actor=actor, finding_id=finding.id, device_id=finding.device_id,
        )
        self.db.commit()
        self.db.refresh(finding)
        return finding
