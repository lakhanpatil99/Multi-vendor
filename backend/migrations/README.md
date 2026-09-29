# Migrations (Alembic)

Schema is reproducible from scratch. The DB URL + metadata are injected from
app settings (`app/core/config.py`), so no connection string lives in version
control.

```bash
# Generate the initial migration (autogenerate from ORM metadata)
alembic revision --autogenerate -m "initial schema"

# Apply migrations
alembic upgrade head
```

For local SQLite quick-start you may instead run `python -m scripts.init_db`
(create_all) followed by `python -m scripts.seed`. Production/Supabase should
use Alembic.
