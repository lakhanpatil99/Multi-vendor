"""Generic tenant-scoped repository.

Every read/write is scoped by organization_id so one tenant can never reach
another's data. Route handlers never touch SQL directly — they go through
services → repositories.
"""
from __future__ import annotations

from typing import Any, Generic, Sequence, TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class TenantRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, db: Session) -> None:
        self.db = db

    # ── Writes ───────────────────────────────────────────────────
    def add(self, obj: ModelT) -> ModelT:
        self.db.add(obj)
        self.db.flush()
        return obj

    def delete(self, obj: ModelT) -> None:
        self.db.delete(obj)
        self.db.flush()

    # ── Reads ────────────────────────────────────────────────────
    def get(self, org_id: str, obj_id: str) -> ModelT | None:
        stmt = select(self.model).where(
            self.model.id == obj_id, self.model.organization_id == org_id
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        org_id: str,
        *,
        filters: dict[str, Any] | None = None,
        offset: int = 0,
        limit: int = 20,
        order_desc: bool = True,
    ) -> tuple[Sequence[ModelT], int]:
        conditions = [self.model.organization_id == org_id]
        for key, value in (filters or {}).items():
            if value is None:
                continue
            column = getattr(self.model, key, None)
            if column is not None:
                conditions.append(column == value)

        base = select(self.model).where(*conditions)
        total = self.db.execute(
            select(func.count()).select_from(base.subquery())
        ).scalar_one()

        order_col = getattr(self.model, "created_at", self.model.id)
        base = base.order_by(order_col.desc() if order_desc else order_col.asc())
        rows = self.db.execute(base.offset(offset).limit(limit)).scalars().all()
        return rows, int(total)
