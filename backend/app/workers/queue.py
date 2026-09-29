"""Job dispatch abstraction.

inline  → run synchronously in-process (offline default; results immediately
          queryable). Used for Phase 2 independent testability.
celery  → enqueue to a Redis-backed worker (Phase 4; not required to run).
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.job import AnalysisJob
from app.services.analysis_service import AnalysisService
from app.workers.tasks import run_analysis_task


def dispatch_analysis(db: Session, org_id: str, actor: str, config_id: str) -> AnalysisJob:
    """Create an analysis job and dispatch it per the configured backend."""
    service = AnalysisService(db)
    job = service.create_job(org_id, config_id)

    if settings.job_backend == "celery" and settings.redis_url:
        # Phase 4: enqueue and return immediately (QUEUED).
        # celery_app.send_task("analysis", args=[org_id, actor, config_id, job.id])
        return job

    # Inline: run now in a fresh session so status reflects completion.
    run_analysis_task(org_id, actor, config_id, job.id)
    db.refresh(job)
    return job
