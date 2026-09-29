# ANCP Backend — Phase 2

FastAPI backend for the **AI Network Compliance Platform**. It ingests
multi-vendor network configurations, detects the vendor, parses them,
normalizes to a **vendor-neutral security model**, deterministically evaluates
compliance across **CIS / NIST / STIG / ISO**, produces **evidence-backed
findings**, explainable **risk**, **vendor-specific remediation** (simulated),
and **audit-ready reports** — all behind a versioned, documented REST API.

> Phase 2 builds the backend **independently**. It is NOT connected to the
> frontend yet (that is Phase 3). It runs **fully offline** with SQLite + local
> storage + a deterministic local AI provider, and targets **Supabase**
> (PostgreSQL / Storage / Auth) purely via environment variables.

---

## Architecture

```
Client → FastAPI → Auth/RBAC → Services → Repositories → DB (SQLite | Supabase Postgres)
                                   │
Ingestion → Vendor Detection → Parser (Cisco|Junos|FortiOS) ─┐
                                                             ▼
                                          Vendor-Neutral Normalized Model + Evidence
                                                             │
                        ┌────────────── Known ──────────────┤────── Unknown ──────┐
                        ▼                                    ▼                     ▼
              Deterministic Compliance Engine        (facts)              AI suggestion → Human Training
                        │                                                          │
                        ▼                                                   Learned Knowledge Base
              Findings → Risk → Remediation → Reporting (PDF/Excel) → Audit Trail
```

**Most important rule:** vendor-specific code ends at the parser/normalization
boundary. The compliance engine, findings, risk, and remediation consume only
the neutral model — there is no `if vendor == "cisco"` inside the compliance
engine. Adding a vendor = add a parser + detection signal + register it.

**AI vs deterministic:** the AI provider may *suggest / classify / find
similarity* for unknown patterns. It never decides compliance, changes a rule,
or executes remediation. Learned patterns require human approval.

## Layout

```
app/
  core/          config, logging (request_id + secret redaction), exceptions,
                 responses, security (auth+RBAC), dependencies, masking
  db/            SQLAlchemy Base (+ JSON type map), session
  models/        ORM models (orgs, users, devices, configurations, facts,
                 frameworks, rules, mappings, runs, findings, training,
                 ai_analysis, remediation, reports, audit, jobs)
  schemas/       Pydantic request/response models
  repositories/  tenant-scoped data access (no SQL in routes)
  parsers/       base + registry + cisco_ios / juniper_junos / fortios
  normalization/ neutral schema, mapper, evidence, normalizer
  compliance/    declarative rules (YAML) + loader + evaluator + engine + risk
  ai/            AIProvider abstraction + local deterministic provider
  remediation/   vendor-aware templates + generator (execution disabled)
  reporting/     PDF (reportlab, guarded) + Excel (openpyxl)
  storage/       StorageBackend (local | Supabase) + upload validation
  services/      application services (device, ingestion, analysis, ...)
  workers/       job dispatch (inline | celery) + analysis task
  api/v1/        routers; api/router.py aggregates under /api/v1
  main.py        app: CORS, request-id, exception handlers, OpenAPI
migrations/       Alembic (initial migration included)
scripts/          seed.py, init_db.py
tests/            pytest suite + fixtures (secure/insecure/unknown)
```

## Quick start (offline — no Supabase needed)

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate        # Windows;  source .venv/bin/activate on *nix
pip install -r requirements.txt

cp .env.example .env            # defaults are offline-ready

# Create schema + seed reference data and the dev org/user
alembic upgrade head            # or: python -m scripts.init_db
python -m scripts.seed

uvicorn app.main:app --reload
# Swagger:  http://localhost:8000/docs
```

Auth in dev mode: send `Authorization: Bearer dev-local-token` (the seeded
ADMIN of the dev organization).

### Try the pipeline (curl)

```bash
TOKEN="dev-local-token"
# 1) upload
curl -s -H "Authorization: Bearer $TOKEN" -F "file=@tests/fixtures/cisco_insecure.cfg" \
     http://localhost:8000/api/v1/configurations/upload
# 2) analyze  → returns {job_id, status}
curl -s -H "Authorization: Bearer $TOKEN" -X POST \
     http://localhost:8000/api/v1/configurations/<CONFIG_ID>/analyze
# 3) inspect findings / normalization / compliance / audit
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/findings?device_id=<DEVICE_ID>"
```

## Environment variables

See [`.env.example`](./.env.example). Highlights:

| Var | Purpose | Offline default |
|-----|---------|-----------------|
| `DATABASE_URL` | Postgres/SQLite URL | (blank → SQLite `./var/ancp.db`) |
| `SUPABASE_URL` / `SUPABASE_*` | Supabase project | (blank) |
| `STORAGE_BACKEND` | `local` \| `supabase` | `local` |
| `AUTH_MODE` | `dev` \| `supabase` (JWT HS256) | `dev` |
| `AI_PROVIDER` | `local` \| (cloud later) | `local` |
| `JOB_BACKEND` | `inline` \| `celery` | `inline` |
| `CORS_ORIGINS` | allowed origins (never `*` in prod) | `http://localhost:3000` |

## Supabase setup

1. Create a Supabase project; copy the URL, anon key, service-role key, and JWT
   secret into `.env`.
2. Set `DATABASE_URL` to the Supabase Postgres connection string
   (`postgresql+psycopg://...`).
3. `alembic upgrade head` then `python -m scripts.seed`.
4. Create Storage buckets `ancp-configurations` and `ancp-reports`; set
   `STORAGE_BACKEND=supabase`.
5. Set `AUTH_MODE=supabase` to validate Supabase-issued JWTs; provision app
   users (rows in `users`) linked by `auth_subject`/email.

## Migrations

```bash
alembic revision --autogenerate -m "change"   # generate
alembic upgrade head                            # apply
```

The DB URL + metadata are injected from app settings (no secrets in Alembic
config). See [`migrations/README.md`](./migrations/README.md).

## Tests

```bash
pytest -q
```

27 tests cover masking, vendor detection, all three parsers (with evidence),
normalization, **deterministic** compliance, risk, the local AI provider, plus
API tests for auth/RBAC, multi-tenant isolation, device CRUD + pagination,
upload validation + secret masking, the **end-to-end insecure-Cisco pipeline**
(findings → evidence → framework mapping → remediation → report → audit),
human training approval, and the error envelope. The pipeline results are
produced by the real parser/rule engine — findings are not hard-coded.

## Docker

```bash
docker build -t ancp-backend .
docker run --env-file .env -p 8000:8000 ancp-backend
```

## Security notes

- **Secrets never persisted/logged.** Uploaded configs are secret-masked before
  storage/analysis; the DB keeps only the sanitized copy, the raw file goes to
  Storage. Logs pass through a redactor; audit events never contain secrets.
- **Credentials are references only.** `device_credential_refs` stores an opaque
  pointer (e.g. `vault://...`), never a plaintext secret. Live SSH collection is
  not enabled in this phase.
- **Authorization enforced server-side** (RBAC: VIEWER < AUDITOR <
  SECURITY_ANALYST < ADMIN); frontend role hints are never trusted.
- **Tenant isolation** on every query via `organization_id` scoping.
- **Uploads validated**: extension allow-list, size limit, UTF-8, no binary.
- **CORS** uses an explicit origin list; wildcard is rejected in production.
- **Rate limiting** on upload / analyze / report / auth endpoints.
- **Errors** return a uniform envelope; internal exceptions are never leaked.

## API response format

```jsonc
// success
{ "data": { ... }, "meta": { ... } }
// paginated
{ "data": [ ... ], "meta": { "page": 1, "page_size": 20, "total": 42, "total_pages": 3 } }
// error
{ "error": { "code": "not_found", "message": "...", "details": {} } }
```

## Not implemented in Phase 2 (by design)

Real SSH/Netmiko/NAPALM collection, cloud LLM/embedding provider, Celery/Redis
execution, remediation **execution**, and the frontend connection — all arrive
in later phases behind the abstractions already in place.
