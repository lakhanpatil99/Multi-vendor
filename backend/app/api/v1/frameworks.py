from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.core.exceptions import NotFoundError
from app.core.responses import success
from app.core.security import ROLE_VIEWER, Principal
from app.db.session import get_db
from app.repositories.framework_repository import FrameworkRepository
from app.schemas.compliance import (
    ComplianceRuleRead,
    FrameworkMappingRead,
    FrameworkRead,
)

router = APIRouter(prefix="/frameworks", tags=["frameworks"])


@router.get("", summary="List compliance frameworks")
def list_frameworks(
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    repo = FrameworkRepository(db)
    return success([FrameworkRead.model_validate(f).model_dump(mode="json")
                    for f in repo.list_frameworks()])


@router.get("/{key}", summary="Get a framework + its mapped canonical rules")
def get_framework(
    key: str,
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    repo = FrameworkRepository(db)
    fw = repo.get_framework(key.upper())
    if not fw:
        raise NotFoundError("Framework not found")
    rules = repo.list_rules()
    mapped = []
    for rule in rules:
        for m in repo.mappings_for_rule(rule.rule_id):
            if m.framework_key == fw.key:
                mapped.append({
                    "rule": ComplianceRuleRead.model_validate(rule).model_dump(mode="json"),
                    "mapping": FrameworkMappingRead.model_validate(m).model_dump(mode="json"),
                })
    return success({
        "framework": FrameworkRead.model_validate(fw).model_dump(mode="json"),
        "controls": mapped,
    })
