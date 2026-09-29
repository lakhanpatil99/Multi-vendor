"""Declarative base + common column mixins.

A `GUID`-style string id and JSON type are used so the same models work on
both SQLite (offline) and PostgreSQL (Supabase) without change.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    # Map Python dict/list annotations to a JSON column so the same models work
    # on SQLite (offline) and PostgreSQL (Supabase) without per-column types.
    type_annotation_map = {
        dict: JSON,
        list: JSON,
    }


class UUIDPKMixin:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )
