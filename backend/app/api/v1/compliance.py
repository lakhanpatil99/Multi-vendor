from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.core.responses import success
from app.core.security import ROLE_VIEWER, Principal
from app.db.session import get_db
from app.services.compliance_service import ComplianceService

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("", summary="Compliance overview (score, status breakdown, frameworks)")
def overview(
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    return success(ComplianceService(db).overview(principal.organization_id))
