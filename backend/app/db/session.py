"""Engine + session management.

Works against Supabase PostgreSQL (via `DATABASE_URL`) or a local SQLite file
(offline default). `get_db` is the FastAPI dependency; `session_scope` is used
by workers/scripts.
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

_connect_args = {}
if settings.is_sqlite:
    # Needed for SQLite when shared across FastAPI's threadpool / tests.
    _connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.effective_database_url,
    echo=False,
    future=True,
    pool_pre_ping=not settings.is_sqlite,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """FastAPI dependency yielding a request-scoped session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope() -> Iterator[Session]:
    """Transactional scope for workers/scripts."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
