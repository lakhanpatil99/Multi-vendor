"""Human-in-the-loop training service.

AI may suggest; only a human APPROVE/MODIFY promotes a pattern into the learned
knowledge base. REJECT disables it. Nothing is auto-promoted.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.models.training_pattern import TrainingFeedback, TrainingPattern
from app.repositories.training_repository import TrainingRepository
from app.services.audit_service import AuditService


class TrainingService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = TrainingRepository(db)
        self.audit = AuditService(db)

    def list(self, org_id: str, *, filters: dict, offset: int, limit: int):
        return self.repo.list(org_id, filters=filters, offset=offset, limit=limit)

    def get(self, org_id: str, pattern_id: str) -> TrainingPattern:
        pattern = self.repo.get(org_id, pattern_id)
        if not pattern:
            raise NotFoundError("Training pattern not found")
        return pattern

    def review(
        self, org_id: str, pattern_id: str, *, decision: str, actor: str,
        category: str | None = None, field: str | None = None, note: str | None = None,
    ) -> TrainingPattern:
        decision = decision.upper()
        if decision not in {"APPROVE", "MODIFY", "REJECT"}:
            raise ValidationError("Invalid decision",
                                  details={"allowed": ["APPROVE", "MODIFY", "REJECT"]})
        pattern = self.get(org_id, pattern_id)

        if decision == "REJECT":
            pattern.status = "REJECTED"
        else:
            pattern.status = "APPROVED"
            pattern.human_confidence = 1.0
            if category:
                pattern.security_category = category
            if field:
                pattern.normalized_field = field
        pattern.approved_by = actor if decision != "REJECT" else None
        pattern.reviewed_at = datetime.now(timezone.utc)
        pattern.review_note = note

        self.repo.add_feedback(TrainingFeedback(
            organization_id=org_id, pattern_id=pattern.id, decision=decision,
            category=category, field=field, note=note, actor=actor,
        ))
        self.audit.log(
            organization_id=org_id, event_type="TRAINING_APPROVED",
            title=f"Training pattern {pattern.status.lower()}",
            description=f"{pattern.raw_pattern[:80]} -> {pattern.normalized_field}",
            actor=actor, pattern_id=pattern.id,
        )
        self.db.commit()
        self.db.refresh(pattern)
        return pattern

    def update(self, org_id: str, pattern_id: str, payload: dict) -> TrainingPattern:
        pattern = self.get(org_id, pattern_id)
        for key, value in payload.items():
            if value is not None and hasattr(pattern, key):
                setattr(pattern, key, value)
        self.db.commit()
        self.db.refresh(pattern)
        return pattern
