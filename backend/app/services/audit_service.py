"""Audit logging service. Records immutable events; NEVER stores secrets or
raw configuration content."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.logging import redact
from app.models.audit_event import AuditEvent


class AuditService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def log(
        self,
        *,
        organization_id: str,
        event_type: str,
        title: str,
        description: str | None = None,
        actor: str | None = None,
        severity: str | None = None,
        device_id: str | None = None,
        configuration_id: str | None = None,
        finding_id: str | None = None,
        report_id: str | None = None,
        pattern_id: str | None = None,
        job_id: str | None = None,
    ) -> AuditEvent:
        event = AuditEvent(
            organization_id=organization_id,
            event_type=event_type,
            title=title,
            # Defense in depth: redact any accidental secret in the description.
            description=redact(description) if description else None,
            actor=actor,
            severity=severity,
            device_id=device_id,
            configuration_id=configuration_id,
            finding_id=finding_id,
            report_id=report_id,
            pattern_id=pattern_id,
            job_id=job_id,
        )
        self.db.add(event)
        self.db.flush()
        return event
