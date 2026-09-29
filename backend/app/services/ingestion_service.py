"""Configuration ingestion: validate → mask secrets → store raw → detect
vendor → persist metadata. Raw content goes to Storage; only a SANITIZED copy
is kept in the DB. Raw content is never logged."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.masking import mask_secrets
from app.models.configuration import Configuration
from app.models.device import Device
from app.parsers.registry import supported_vendors
from app.repositories.configuration_repository import ConfigurationRepository
from app.repositories.device_repository import DeviceRepository
from app.services.audit_service import AuditService
from app.services.vendor_detection_service import VendorDetectionService
from app.storage.file_manager import file_type_from_name, validate_upload
from app.storage.supabase_storage import get_storage

_SYNTAX = {"cisco": "FLAT", "juniper": "HIERARCHICAL", "fortinet": "BLOCK"}


class IngestionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.configs = ConfigurationRepository(db)
        self.devices = DeviceRepository(db)
        self.audit = AuditService(db)
        self.detector = VendorDetectionService()

    def ingest_upload(
        self,
        *,
        org_id: str,
        actor: str,
        filename: str,
        data: bytes,
        device_id: str | None = None,
        source: str = "FILE_UPLOAD",
    ) -> Configuration:
        text = validate_upload(filename, data)  # raises ValidationError if bad
        sanitized = mask_secrets(text)
        detection = self.detector.detect(text)

        # Link or create a device (placeholder hostname refined during analysis).
        device = None
        if device_id:
            device = self.devices.get(org_id, device_id)
        if device is None:
            device = Device(
                organization_id=org_id,
                hostname=filename.rsplit(".", 1)[0],
                vendor=detection.vendor,
                device_type="OTHER",
                os_name=detection.os,
                status="PENDING",
            )
            self.devices.add(device)

        config = Configuration(
            organization_id=org_id,
            device_id=device.id,
            source=source,
            file_name=filename,
            file_type=file_type_from_name(filename),
            sanitized_content=sanitized,
            line_count=len(text.splitlines()),
            size_bytes=len(data),
            detected_vendor=detection.vendor,
            detected_os=detection.os,
            detection_confidence=detection.confidence,
            syntax_style=_SYNTAX.get(detection.vendor),
            parser_status="PENDING",
            normalization_status="PENDING",
            analysis_status="PENDING",
        )
        self.configs.add(config)

        # Store the RAW original in Storage (never in the DB).
        storage = get_storage()
        key = f"{org_id}/{config.id}/{filename}"
        config.raw_storage_path = storage.put(
            "ancp-configurations", key, data, "text/plain"
        )
        self.db.flush()

        self.audit.log(
            organization_id=org_id,
            event_type="CONFIGURATION_UPLOADED",
            title="Configuration uploaded",
            description=f"{filename} ({len(data)} bytes) via {source}",
            actor=actor,
            configuration_id=config.id,
            device_id=device.id,
        )
        if detection.vendor in supported_vendors():
            self.audit.log(
                organization_id=org_id,
                event_type="VENDOR_DETECTED",
                title="Vendor detected",
                description=f"{detection.vendor}/{detection.os} "
                            f"(confidence {detection.confidence})",
                actor="system",
                configuration_id=config.id,
                device_id=device.id,
            )
        self.db.commit()
        self.db.refresh(config)
        return config
