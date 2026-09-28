# shared/ — Cross-cutting contracts

Placeholder for contracts shared between frontend and backend (Phase 2+).

In Phase 1, the canonical domain types live in `frontend/types/`. When the backend is built,
the shared JSON Schemas / OpenAPI contracts derived from those types will live here so both
sides stay in sync.

Planned contents:
- `openapi/` — generated OpenAPI spec
- `schemas/` — JSON Schema for domain models (Device, Configuration, Finding, ...)
- `events/` — Kafka event contracts for the analysis pipeline
