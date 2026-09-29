from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import (
    Pagination,
    get_current_principal,
    pagination_params,
    require_roles,
)
from app.core.responses import paginated, success
from app.core.security import ROLE_ANALYST, ROLE_VIEWER, Principal
from app.db.session import get_db
from app.schemas.devices import DeviceCreate, DeviceRead, DeviceUpdate
from app.services.device_service import DeviceService

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("", summary="List devices (paginated, filterable)")
def list_devices(
    vendor: str | None = Query(None),
    device_type: str | None = Query(None),
    status: str | None = Query(None),
    page_params: Pagination = Depends(pagination_params),
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    filters = {"vendor": vendor, "device_type": device_type, "status": status}
    items, total = DeviceService(db).list(
        principal.organization_id, filters=filters,
        offset=page_params.offset, limit=page_params.page_size,
    )
    return paginated(
        [DeviceRead.model_validate(d).model_dump(mode="json") for d in items],
        page=page_params.page, page_size=page_params.page_size, total=total,
    )


@router.post("", status_code=201, summary="Create a device")
def create_device(
    payload: DeviceCreate,
    principal: Principal = Depends(require_roles(ROLE_ANALYST)),
    db: Session = Depends(get_db),
) -> dict:
    device = DeviceService(db).create(principal.organization_id, principal.email, payload)
    return success(DeviceRead.model_validate(device).model_dump(mode="json"))


@router.get("/{device_id}", summary="Get a device")
def get_device(
    device_id: str,
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    device = DeviceService(db).get(principal.organization_id, device_id)
    return success(DeviceRead.model_validate(device).model_dump(mode="json"))


@router.patch("/{device_id}", summary="Update a device")
def update_device(
    device_id: str,
    payload: DeviceUpdate,
    principal: Principal = Depends(require_roles(ROLE_ANALYST)),
    db: Session = Depends(get_db),
) -> dict:
    device = DeviceService(db).update(principal.organization_id, device_id, payload)
    return success(DeviceRead.model_validate(device).model_dump(mode="json"))


@router.delete("/{device_id}", summary="Delete a device")
def delete_device(
    device_id: str,
    principal: Principal = Depends(require_roles(ROLE_ANALYST)),
    db: Session = Depends(get_db),
) -> dict:
    DeviceService(db).delete(principal.organization_id, device_id)
    return success({"deleted": device_id})
