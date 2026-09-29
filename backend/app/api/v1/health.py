from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.responses import success
from app.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health", summary="Liveness + basic info")
def health() -> dict:
    return success({"status": "ok", "app": settings.app_name, "env": settings.app_env})


@router.get("/health/live", summary="Liveness probe")
def live() -> dict:
    return success({"status": "alive"})


@router.get("/health/ready", summary="Readiness probe (verifies DB)")
def ready(db: Session = Depends(get_db)) -> dict:
    checks = {"database": "ok"}
    try:
        db.execute(text("SELECT 1"))
    except Exception:  # pragma: no cover
        checks["database"] = "error"
    ready_ok = all(v == "ok" for v in checks.values())
    return success({"status": "ready" if ready_ok else "degraded", "checks": checks})
