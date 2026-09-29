from __future__ import annotations

from app.models.device import Device
from app.repositories.base import TenantRepository


class DeviceRepository(TenantRepository[Device]):
    model = Device
