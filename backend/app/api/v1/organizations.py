from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_principal
from app.core.exceptions import NotFoundError
from app.core.responses import success
from app.core.security import Principal
from app.db.session import get_db
from app.models.organization import Organization

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/current", summary="Get the caller's organization")
def current_org(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> dict:
    org = db.get(Organization, principal.organization_id)
    if not org:
        raise NotFoundError("Organization not found")
    return success({"id": org.id, "name": org.name, "slug": org.slug})
