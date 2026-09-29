from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import Pagination, pagination_params, require_roles
from app.core.responses import paginated, success
from app.core.security import ROLE_ANALYST, ROLE_VIEWER, Principal
from app.db.session import get_db
from app.schemas.training import TrainingPatternRead, TrainingPatternUpdate, TrainingReview
from app.services.training_service import TrainingService

router = APIRouter(prefix="/training", tags=["training"])


@router.get("/patterns", summary="List training patterns")
def list_patterns(
    status: str | None = Query(None),
    vendor: str | None = Query(None),
    page_params: Pagination = Depends(pagination_params),
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    filters = {"status": status, "vendor": vendor}
    items, total = TrainingService(db).list(
        principal.organization_id, filters=filters,
        offset=page_params.offset, limit=page_params.page_size,
    )
    return paginated(
        [TrainingPatternRead.model_validate(p).model_dump(mode="json") for p in items],
        page=page_params.page, page_size=page_params.page_size, total=total,
    )


@router.get("/patterns/{pattern_id}", summary="Get a training pattern")
def get_pattern(
    pattern_id: str,
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    p = TrainingService(db).get(principal.organization_id, pattern_id)
    return success(TrainingPatternRead.model_validate(p).model_dump(mode="json"))


@router.post("/patterns/{pattern_id}/approve", summary="Approve (learn) a pattern")
def approve_pattern(
    pattern_id: str,
    payload: TrainingReview | None = None,
    principal: Principal = Depends(require_roles(ROLE_ANALYST)),
    db: Session = Depends(get_db),
) -> dict:
    payload = payload or TrainingReview(decision="APPROVE")
    decision = "MODIFY" if (payload.category or payload.field) else "APPROVE"
    p = TrainingService(db).review(
        principal.organization_id, pattern_id, decision=decision,
        actor=principal.email, category=payload.category, field=payload.field,
        note=payload.note,
    )
    return success(TrainingPatternRead.model_validate(p).model_dump(mode="json"))


@router.post("/patterns/{pattern_id}/reject", summary="Reject a pattern")
def reject_pattern(
    pattern_id: str,
    payload: TrainingReview | None = None,
    principal: Principal = Depends(require_roles(ROLE_ANALYST)),
    db: Session = Depends(get_db),
) -> dict:
    note = payload.note if payload else None
    p = TrainingService(db).review(
        principal.organization_id, pattern_id, decision="REJECT",
        actor=principal.email, note=note,
    )
    return success(TrainingPatternRead.model_validate(p).model_dump(mode="json"))


@router.patch("/patterns/{pattern_id}", summary="Update a training pattern")
def update_pattern(
    pattern_id: str,
    payload: TrainingPatternUpdate,
    principal: Principal = Depends(require_roles(ROLE_ANALYST)),
    db: Session = Depends(get_db),
) -> dict:
    p = TrainingService(db).update(
        principal.organization_id, pattern_id,
        payload.model_dump(exclude_unset=True),
    )
    return success(TrainingPatternRead.model_validate(p).model_dump(mode="json"))
