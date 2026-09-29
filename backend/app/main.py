"""ANCP FastAPI application.

Wires CORS (never wildcard in production), a request-id middleware, uniform
exception handlers that emit the standard error envelope (never leaking
internals), and the versioned API router. OpenAPI/Swagger documents every
endpoint at /docs.
"""
from __future__ import annotations

import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging, get_logger, set_request_id
from app.core.responses import error_body

configure_logging(settings.log_level)
logger = get_logger("ancp.api")

app = FastAPI(
    title="AI Network Compliance Platform — Backend",
    version=__version__,
    description=(
        "ANCP backend API. Ingests multi-vendor configurations, detects vendor, "
        "parses, normalizes to a vendor-neutral security model, deterministically "
        "evaluates compliance across CIS/NIST/STIG/ISO, produces evidence-backed "
        "findings, risk, vendor-specific remediation, and audit-ready reports. "
        "Auth: send `Authorization: Bearer <token>` (dev token in dev mode)."
    ),
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,  # explicit list, never "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    rid = request.headers.get("x-request-id") or str(uuid.uuid4())
    set_request_id(rid)
    try:
        response = await call_next(request)
    finally:
        set_request_id(None)
    response.headers["x-request-id"] = rid
    return response


# ── Exception handlers (uniform envelope; no internal leakage) ──
@app.exception_handler(AppError)
async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=error_body(exc.code, exc.message, exc.details),
    )


@app.exception_handler(RequestValidationError)
async def handle_validation(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=error_body("validation_error", "Request validation failed",
                           {"errors": exc.errors()[:10]}),
    )


@app.exception_handler(Exception)
async def handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
    # Log the detail server-side; return an opaque message to the client.
    logger.exception("unhandled error")
    return JSONResponse(
        status_code=500,
        content=error_body("internal_error", "An internal error occurred"),
    )


app.include_router(api_router)


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"service": "ancp-backend", "docs": "/docs", "health": "/api/v1/health"}
