"""Create all tables from the ORM metadata (offline/quick-start convenience).

For production/Supabase use Alembic migrations (see migrations/). This helper is
handy for local SQLite and for tests. Run: python -m scripts.init_db
"""
from __future__ import annotations

from app.db.base import Base
from app.db.session import engine
import app.models  # noqa: F401  (registers all tables)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    print("Tables created:", len(Base.metadata.tables))


if __name__ == "__main__":
    init_db()
