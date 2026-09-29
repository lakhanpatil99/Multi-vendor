"""File validation + safe handling for configuration uploads.

Enforces extension allow-list, size limit, and UTF-8 decodability BEFORE any
content is parsed or stored. Raw content is never logged.
"""
from __future__ import annotations

from pathlib import Path

from app.core.config import settings
from app.core.exceptions import ValidationError


def validate_upload(filename: str, data: bytes) -> str:
    """Validate an uploaded configuration file; return decoded text.

    Raises ValidationError (safe message, no content) on any violation.
    """
    ext = Path(filename).suffix.lower()
    if ext not in settings.allowed_extensions:
        raise ValidationError(
            "Unsupported file type",
            details={"allowed": sorted(settings.allowed_extensions)},
        )
    if len(data) == 0:
        raise ValidationError("Empty file")
    if len(data) > settings.max_upload_bytes:
        raise ValidationError(
            "File exceeds maximum size",
            details={"max_bytes": settings.max_upload_bytes},
        )
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        raise ValidationError("File must be UTF-8 encoded text")
    if "\x00" in text:
        raise ValidationError("Binary content not allowed")
    return text


def file_type_from_name(filename: str) -> str:
    return Path(filename).suffix.lstrip(".").upper() or "TXT"
