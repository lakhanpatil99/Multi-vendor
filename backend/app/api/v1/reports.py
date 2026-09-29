from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import (
    Pagination,
    RateLimit,
    pagination_params,
    require_roles,
)
from app.core.responses import paginated, success
from app.core.security import ROLE_ANALYST, ROLE_VIEWER, Principal
from app.db.session import get_db
from app.schemas.reports import ReportCreate, ReportRead
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", summary="List reports")
def list_reports(
    page_params: Pagination = Depends(pagination_params),
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    items, total = ReportService(db).list(
        principal.organization_id, offset=page_params.offset, limit=page_params.page_size
    )
    return paginated(
        [ReportRead.model_validate(r).model_dump(mode="json") for r in items],
        page=page_params.page, page_size=page_params.page_size, total=total,
    )


@router.post("", status_code=201, summary="Generate a report",
             dependencies=[Depends(RateLimit("report"))])
def create_report(
    payload: ReportCreate,
    principal: Principal = Depends(require_roles(ROLE_ANALYST)),
    db: Session = Depends(get_db),
) -> dict:
    report = ReportService(db).generate(principal.organization_id, principal.email, payload)
    return success(ReportRead.model_validate(report).model_dump(mode="json"))


@router.get("/{report_id}", summary="Get a report (preview DTO)")
def get_report(
    report_id: str,
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    report = ReportService(db).get(principal.organization_id, report_id)
    return success(ReportRead.model_validate(report).model_dump(mode="json"))
