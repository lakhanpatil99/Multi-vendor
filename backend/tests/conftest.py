"""Pytest fixtures.

Configures an isolated temp SQLite DB + local storage + dev auth BEFORE any app
module is imported, so the backend is exercised fully offline.
"""
from __future__ import annotations

import os
import tempfile
from pathlib import Path

import pytest

# ── Configure environment before importing the app ──────────────
_TMP = Path(tempfile.mkdtemp(prefix="ancp-test-"))
os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = f"sqlite:///{(_TMP / 'test.db').as_posix()}"
os.environ["STORAGE_BACKEND"] = "local"
os.environ["STORAGE_LOCAL_DIR"] = (_TMP / "storage").as_posix()
os.environ["AUTH_MODE"] = "dev"
os.environ["DEV_API_TOKEN"] = "test-token"
os.environ["AI_PROVIDER"] = "local"
os.environ["JOB_BACKEND"] = "inline"

from fastapi.testclient import TestClient  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import engine, session_scope  # noqa: E402
import app.models  # noqa: E402,F401
from app.main import app  # noqa: E402
from app.models.organization import Organization, User  # noqa: E402
from scripts.seed import seed  # noqa: E402

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="session", autouse=True)
def _db_setup():
    Base.metadata.create_all(bind=engine)
    seed()  # frameworks, rules, dev org/user
    from app.core.config import settings
    from sqlalchemy import select
    # Second org + user for multi-tenant isolation tests; VIEWER for RBAC tests.
    with session_scope() as db:
        org2 = Organization(name="Beta Corp", slug="beta-corp")
        db.add(org2)
        db.flush()
        u2 = User(organization_id=org2.id, email="beta@beta.example",
                  full_name="Beta Admin", role="ADMIN")
        db.add(u2)
        db.flush()
        globals()["_ORG2_USER_ID"] = u2.id

        org1 = db.execute(
            select(Organization).where(Organization.slug == settings.dev_org_slug)
        ).scalar_one()
        viewer = User(organization_id=org1.id, email="viewer@acme.example",
                      full_name="Read Only", role="VIEWER")
        db.add(viewer)
        db.flush()
        globals()["_VIEWER_USER_ID"] = viewer.id
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def auth_headers() -> dict:
    # Default seeded ADMIN principal (dev token).
    return {"Authorization": "Bearer test-token"}


@pytest.fixture()
def other_org_headers() -> dict:
    # Impersonate the second org's user via dev impersonation token.
    return {"Authorization": f"Bearer dev:{globals()['_ORG2_USER_ID']}"}


@pytest.fixture()
def viewer_headers() -> dict:
    # A VIEWER (read-only) principal in the default org for RBAC tests.
    return {"Authorization": f"Bearer dev:{globals()['_VIEWER_USER_ID']}"}


def fixture_text(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")
