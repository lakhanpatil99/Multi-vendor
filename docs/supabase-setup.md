# Supabase Initialization — ANCP

The ANCP schema is defined by the SQLAlchemy models in `backend/app/models/` and
the Alembic migrations in `backend/migrations/versions/`. Those are the **source
of truth**. This guide applies that schema to a Supabase PostgreSQL project.

> The Supabase SQL editor looks empty because the migrations have only ever been
> applied to the local SQLite dev database. They have never been pointed at
> Supabase. Nothing needs to be redesigned — just applied.

## 0. Prerequisites (from your Supabase project → Settings → Database / API)

Collect (keep secret — never put in the frontend or commit):
- Database connection string (Session pooler, port 5432 or 6543)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- JWT Secret (Settings → API → JWT Secret)

## 1. Point the backend at Supabase

In `backend/.env` (copy from `.env.example`):

```
DATABASE_URL=postgresql+psycopg://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_JWT_SECRET=<jwt secret>
STORAGE_BACKEND=supabase
AUTH_MODE=supabase        # or keep 'dev' until Supabase Auth users are provisioned
APP_ENV=production        # enforces non-wildcard CORS
CORS_ORIGINS=https://<your-frontend-domain>
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `SUPABASE_JWT_SECRET`,
or AI keys to the browser. The frontend only ever gets `NEXT_PUBLIC_API_BASE_URL`.

## 2. Apply the schema — recommended: Alembic

```bash
cd backend
.\.venv\Scripts\activate
alembic upgrade head
alembic current          # must equal: 7f1a8f8d0873 (head)
```

This creates all 19 application tables + `alembic_version`, with foreign keys,
indexes, and constraints, on your Supabase Postgres.

### Alternative: apply via the Supabase SQL editor

If you prefer running SQL directly, use the generated, reviewable DDL:

```
backend/migrations/postgres_schema.sql
```

Paste it into the Supabase SQL editor and run. It is the exact PostgreSQL
rendering of the migrations (`TIMESTAMP WITH TIME ZONE`, `JSON`,
`DOUBLE PRECISION`, `VARCHAR(36)` ids, FK `ON DELETE`, 60 indexes). It also
inserts the `alembic_version` row so future `alembic upgrade` calls stay in sync.

## 3. Seed reference data (idempotent)

```bash
python -m scripts.seed
```

`scripts/seed.py` is idempotent — it checks existence before inserting and never
duplicates. It seeds only:
- the 4 frameworks (CIS / NIST / STIG / ISO)
- the 12 canonical compliance rules + their framework control mappings
- the dev organization + dev user (used only in `AUTH_MODE=dev`)

It does **not** insert fake devices/configurations/findings/reports — those are
produced only by real analysis. There is no risk of the production app mistaking
seed data for customer findings.

## 4. Storage buckets

The backend's storage abstraction (`app/storage/supabase_storage.py`) uses two
buckets (names from `backend/.env`):

| Bucket | Env var | Contents | Access |
|--------|---------|----------|--------|
| `ancp-configurations` | `STORAGE_BUCKET_CONFIGS` | raw uploaded config files | **Private** |
| `ancp-reports` | `STORAGE_BUCKET_REPORTS` | generated PDF/Excel reports | **Private** |

Create both in Supabase Storage as **private** buckets. Raw configuration files
are sensitive (they can contain credentials) and must never be public; the
backend serves downloads via short-lived signed URLs.

## 5. Auth

Backend JWT validation (`app/core/security.py`, `AUTH_MODE=supabase`):

```
Supabase Auth user → JWT (HS256, SUPABASE_JWT_SECRET) → FastAPI validates
→ maps claim (sub/email) to a row in `users` → organization_id + role → RBAC
```

Provision each app user as a row in `users` (organization_id, email, role,
`auth_subject` = Supabase user id). Roles: `ADMIN`, `SECURITY_ANALYST`,
`AUDITOR`, `VIEWER`. Do not replace this with a custom password system.

## 6. Row Level Security (RLS)

The backend connects to Postgres with a **single privileged connection**
(`DATABASE_URL`), not per-user Supabase JWT context. Therefore:

- **Tenant isolation is enforced in the application layer** — every repository
  query is scoped by `organization_id` (`app/repositories/base.py`), verified by
  the multi-tenant tests and the live cross-org→404 check.
- RLS on these tables is **optional defense-in-depth**. If you enable it, the
  backend's role must be allowed (or RLS bypassed for it), and policies must be
  written around `organization_id` — **never** permissive `USING (true)` on
  sensitive tables. Do not enable RLS blindly, as it can break the backend's
  service connection.

## 7. Verify

```bash
uvicorn app.main:app --port 8000
# then, in another shell:
python -m scripts.phase4_validate      # 34/34 live checks
```

Catalog verification (Supabase SQL editor):
```sql
select table_name from information_schema.tables
 where table_schema='public' order by 1;          -- 19 tables + alembic_version
select count(*) from information_schema.table_constraints
 where constraint_type='FOREIGN KEY';              -- FK count
select version_num from alembic_version;           -- 7f1a8f8d0873
```
