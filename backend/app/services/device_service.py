"""Device application service."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.device import Device
from app.repositories.device_repository import DeviceRepository
from app.schemas.devices import DeviceCreate, DeviceUpdate
from app.services.audit_service import AuditService


class DeviceService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = DeviceRepository(db)
        self.audit = AuditService(db)

    def list(self, org_id: str, *, filters: dict, offset: int, limit: int):
        return self.repo.list(org_id, filters=filters, offset=offset, limit=limit)

    def get(self, org_id: str, device_id: str) -> Device:
        device = self.repo.get(org_id, device_id)
        if not device:
            raise NotFoundError("Device not found")
        return device

    def create(self, org_id: str, actor: str, payload: DeviceCreate) -> Device:
        device = Device(organization_id=org_id, **payload.model_dump())
        self.repo.add(device)
        self.db.commit()
        self.db.refresh(device)
        return device

    def update(self, org_id: str, device_id: str, payload: DeviceUpdate) -> Device:
        device = self.get(org_id, device_id)
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(device, key, value)
        self.db.commit()
        self.db.refresh(device)
        return device

    def delete(self, org_id: str, device_id: str) -> None:
        device = self.get(org_id, device_id)
        self.repo.delete(device)
        self.db.commit()
