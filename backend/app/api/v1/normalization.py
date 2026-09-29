from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.core.exceptions import NotFoundError
from app.core.responses import success
from app.core.security import ROLE_VIEWER, Principal
from app.db.session import get_db
from app.schemas.normalization import NormalizedFactRead
from app.services.configuration_service import ConfigurationService

router = APIRouter(prefix="/normalization", tags=["normalization"])


@router.get("/{config_id}", summary="Get the normalized model + security facts")
def get_normalized(
    config_id: str,
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    nc, facts = ConfigurationService(db).normalized(principal.organization_id, config_id)
    if not nc:
        raise NotFoundError("Normalized model not found; run analysis first")
    return success({
        "configuration_id": config_id,
        "schema_version": nc.schema_version,
        "model": nc.model,
        "facts": [NormalizedFactRead.model_validate(f).model_dump(mode="json") for f in facts],
    })
