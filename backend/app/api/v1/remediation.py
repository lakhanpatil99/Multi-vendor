from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import Pagination, pagination_params, require_roles
from app.core.responses import paginated, success
from app.core.security import ROLE_ANALYST, ROLE_VIEWER, Principal
from app.db.session import get_db
from app.schemas.remediation import RemediationDecision, RemediationRead
from app.services.remediation_service import RemediationService

router = APIRouter(prefix="/remediation", tags=["remediation"])


@router.get("", summary="List remediations (paginated, filterable)")
def list_remediation(
    vendor: str | None = Query(None),
    severity: str | None = Query(None),
    status: str | None = Query(None),
    device_id: str | None = Query(None),
    page_params: Pagination = Depends(pagination_params),
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    filters = {"vendor": vendor, "severity": severity, "status": status,
               "device_id": device_id}
    items, total = RemediationService(db).list(
        principal.organization_id, filters=filters,
        offset=page_params.offset, limit=page_params.page_size,
    )
    return paginated(
        [RemediationRead.model_validate(r).model_dump(mode="json") for r in items],
        page=page_params.page, page_size=page_params.page_size, total=total,
    )


@router.get("/{remediation_id}", summary="Get a remediation (simulated commands)")
def get_remediation(
    remediation_id: str,
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    rem = RemediationService(db).get(principal.organization_id, remediation_id)
    return success(RemediationRead.model_validate(rem).model_dump(mode="json"))


@router.post("/{remediation_id}/decision", summary="Approve or reject (no execution)")
def decide_remediation(
    remediation_id: str,
    payload: RemediationDecision,
    principal: Principal = Depends(require_roles(ROLE_ANALYST)),
    db: Session = Depends(get_db),
) -> dict:
    rem = RemediationService(db).decide(
        principal.organization_id, remediation_id, payload.decision, principal.email
    )
    return success(RemediationRead.model_validate(rem).model_dump(mode="json"))
