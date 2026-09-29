"""Analysis task definition, isolated from transport/business wiring.

`run_analysis_task` opens its own DB session so it can run either inline
(offline default) or from a Celery worker (Phase 4) without change.
"""
from __future__ import annotations

from app.core.logging import get_logger, set_job_id
from app.db.session import session_scope
from app.models.job import AnalysisJob
from app.services.analysis_service import AnalysisService

logger = get_logger("ancp.worker")


def run_analysis_task(org_id: str, actor: str, config_id: str, job_id: str) -> None:
    set_job_id(job_id)
    logger.info("analysis job start config=%s", config_id)
    try:
        with session_scope() as db:
            job = db.get(AnalysisJob, job_id)
            if job is None:
                logger.info("job %s not found", job_id)
                return
            AnalysisService(db).run(org_id, actor, config_id, job)
        logger.info("analysis job done config=%s", config_id)
    finally:
        set_job_id(None)
