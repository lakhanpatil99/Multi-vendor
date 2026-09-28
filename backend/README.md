# backend/ — Phase 2+ (NOT IMPLEMENTED in Phase 1)

Architecture placeholder. The backend will be implemented starting Phase 2.

## Planned Architecture

```
backend/
├── app/
│   ├── api/                # FastAPI routers (devices, configurations, compliance, ...)
│   ├── core/               # settings, security, logging
│   ├── domain/             # domain models mirroring shared/ contracts
│   ├── services/           # business services (real implementations of FE service contracts)
│   ├── ingestion/          # file upload + SSH/Netmiko/NAPALM collectors
│   ├── parsing/            # vendor-aware parsers (Cisco IOS / Junos / FortiOS)
│   ├── normalization/      # vendor-neutral normalization engine
│   ├── ai/                 # embeddings, similarity, pattern suggestion
│   ├── compliance/         # deterministic rules + framework correlation engine
│   ├── remediation/        # vendor-specific remediation generation
│   ├── reporting/          # PDF (WeasyPrint/ReportLab) + Excel (openpyxl)
│   └── audit/              # immutable audit trail
├── workers/                # Celery workers (parse/analyze/report jobs)
└── migrations/             # Alembic migrations
```

## Planned Infrastructure

- PostgreSQL (primary datastore)
- Redis (cache + Celery broker/result)
- Kafka (event streaming for analysis pipeline)
- Celery (async task execution)

None of these are implemented in Phase 1.
