from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_principal
from app.core.responses import success
from app.core.security import Principal

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", summary="Current authenticated principal")
def me(principal: Principal = Depends(get_current_principal)) -> dict:
    return success({
        "user_id": principal.user_id,
        "organization_id": principal.organization_id,
        "email": principal.email,
        "role": principal.role,
    })
