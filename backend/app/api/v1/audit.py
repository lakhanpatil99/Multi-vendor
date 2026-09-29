from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import Pagination, pagination_params, require_roles
from app.core.responses import paginated
from app.core.security import ROLE_AUDITOR, Principal
from app.db.session import get_db
from app.repositories.audit_repository import AuditRepository
from app.schemas.audit import AuditEventRead

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", summary="List audit events (paginated, filterable)")
def list_audit(
    event_type: str | None = Query(None),
    device_id: str | None = Query(None),
    page_params: Pagination = Depends(pagination_params),
    principal: Principal = Depends(require_roles(ROLE_AUDITOR)),
    db: Session = Depends(get_db),
) -> dict:
    filters = {"event_type": event_type, "device_id": device_id}
    items, total = AuditRepository(db).list(
        principal.organization_id, filters=filters,
        offset=page_params.offset, limit=page_params.page_size,
    )
    return paginated(
        [AuditEventRead.model_validate(a).model_dump(mode="json") for a in items],
        page=page_params.page, page_size=page_params.page_size, total=total,
    )
