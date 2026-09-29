from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import Pagination, pagination_params, require_roles
from app.core.responses import paginated, success
from app.core.security import ROLE_ANALYST, ROLE_VIEWER, Principal
from app.db.session import get_db
from app.schemas.findings import FindingRead, FindingUpdate
from app.services.finding_service import FindingService

router = APIRouter(prefix="/findings", tags=["findings"])


@router.get("", summary="List findings (paginated, filterable)")
def list_findings(
    severity: str | None = Query(None),
    status: str | None = Query(None),
    category: str | None = Query(None),
    device_id: str | None = Query(None),
    page_params: Pagination = Depends(pagination_params),
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    filters = {"severity": severity, "status": status, "category": category,
               "device_id": device_id}
    items, total = FindingService(db).list(
        principal.organization_id, filters=filters,
        offset=page_params.offset, limit=page_params.page_size,
    )
    return paginated(
        [FindingRead.model_validate(f).model_dump(mode="json") for f in items],
        page=page_params.page, page_size=page_params.page_size, total=total,
    )


@router.get("/{finding_id}", summary="Get a finding with evidence + framework mappings")
def get_finding(
    finding_id: str,
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    finding = FindingService(db).get(principal.organization_id, finding_id)
    return success(FindingRead.model_validate(finding).model_dump(mode="json"))


@router.patch("/{finding_id}", summary="Update finding status")
def update_finding(
    finding_id: str,
    payload: FindingUpdate,
    principal: Principal = Depends(require_roles(ROLE_ANALYST)),
    db: Session = Depends(get_db),
) -> dict:
    finding = FindingService(db).update_status(
        principal.organization_id, finding_id, payload.status, principal.email
    )
    return success(FindingRead.model_validate(finding).model_dump(mode="json"))
