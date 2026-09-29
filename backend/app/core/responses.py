"""Consistent success/error response envelopes.

Success: {"data": ..., "meta": {...}}
Error:   {"error": {"code": ..., "message": ..., "details": {...}}}
"""
from __future__ import annotations

from typing import Any


def success(data: Any, meta: dict[str, Any] | None = None) -> dict[str, Any]:
    return {"data": data, "meta": meta or {}}


def error_body(
    code: str, message: str, details: dict[str, Any] | None = None
) -> dict[str, Any]:
    return {"error": {"code": code, "message": message, "details": details or {}}}


def paginated(
    items: list[Any], *, page: int, page_size: int, total: int
) -> dict[str, Any]:
    total_pages = (total + page_size - 1) // page_size if page_size else 0
    return {
        "data": items,
        "meta": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
        },
    }
