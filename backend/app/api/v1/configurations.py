from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.dependencies import (
    Pagination,
    RateLimit,
    get_current_principal,
    pagination_params,
    require_roles,
)
from app.core.responses import paginated, success
from app.core.security import ROLE_ANALYST, ROLE_VIEWER, Principal
from app.db.session import get_db
from app.schemas.configurations import (
    AnalyzeResponse,
    ConfigurationDetail,
    ConfigurationRead,
    ConnectionTestRequest,
)
from app.services.configuration_service import ConfigurationService
from app.services.ingestion_service import IngestionService
from app.workers.queue import dispatch_analysis

router = APIRouter(prefix="/configurations", tags=["configurations"])


@router.get("", summary="List configurations (paginated, filterable)")
def list_configs(
    vendor: str | None = Query(None, alias="detected_vendor"),
    source: str | None = Query(None),
    status: str | None = Query(None, alias="analysis_status"),
    page_params: Pagination = Depends(pagination_params),
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    filters = {"detected_vendor": vendor, "source": source, "analysis_status": status}
    items, total = ConfigurationService(db).list(
        principal.organization_id, filters=filters,
        offset=page_params.offset, limit=page_params.page_size,
    )
    return paginated(
        [ConfigurationRead.model_validate(c).model_dump(mode="json") for c in items],
        page=page_params.page, page_size=page_params.page_size, total=total,
    )


@router.post("/upload", status_code=201, summary="Upload a configuration file",
             dependencies=[Depends(RateLimit("upload"))])
async def upload_config(
    file: UploadFile = File(...),
    device_id: str | None = Form(None),
    source: str = Form("FILE_UPLOAD"),
    principal: Principal = Depends(require_roles(ROLE_ANALYST)),
    db: Session = Depends(get_db),
) -> dict:
    data = await file.read()
    config = IngestionService(db).ingest_upload(
        org_id=principal.organization_id, actor=principal.email,
        filename=file.filename or "config.cfg", data=data,
        device_id=device_id, source=source,
    )
    return success(ConfigurationRead.model_validate(config).model_dump(mode="json"))


@router.get("/{config_id}", summary="Get a configuration (sanitized content)")
def get_config(
    config_id: str,
    principal: Principal = Depends(require_roles(ROLE_VIEWER)),
    db: Session = Depends(get_db),
) -> dict:
    cfg = ConfigurationService(db).get(principal.organization_id, config_id)
    return success(ConfigurationDetail.model_validate(cfg).model_dump(mode="json"))


@router.post("/{config_id}/analyze", summary="Run the analysis pipeline",
             response_model=None, dependencies=[Depends(RateLimit("analyze"))])
def analyze_config(
    config_id: str,
    principal: Principal = Depends(require_roles(ROLE_ANALYST)),
    db: Session = Depends(get_db),
) -> dict:
    ConfigurationService(db).get(principal.organization_id, config_id)  # tenant check
    job = dispatch_analysis(db, principal.organization_id, principal.email, config_id)
    return success(AnalyzeResponse(job_id=job.id, status=job.status).model_dump())


@router.post("/connect/test", summary="Simulated live-device connection test")
def test_connection(
    payload: ConnectionTestRequest,
    principal: Principal = Depends(require_roles(ROLE_ANALYST)),
    db: Session = Depends(get_db),
) -> dict:
    result = ConfigurationService(db).test_connection(payload)
    return success(result.model_dump())
