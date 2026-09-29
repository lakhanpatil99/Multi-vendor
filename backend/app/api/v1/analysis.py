from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_principal, require_roles
from app.core.exceptions import NotFoundError
from app.core.responses import success
from app.core.security import ROLE_VIEWER, Principal
from app.db.session import get_db
from app.repositories.audit_repository import JobRepository
from app.schemas.audit import JobRead

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.get("/{job_id}", summary="Get analysis job status")
def get_job(
    job_id: str,
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    job = JobRepository(db).get(principal.organization_id, job_id)
    if not job:
        raise NotFoundError("Job not found")
    return success(JobRead.model_validate(job).model_dump(mode="json"))
