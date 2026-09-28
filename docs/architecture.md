# ANCP — System Architecture

> AI-Driven Multi-Vendor Network Security Compliance Auditor (SIH26155)

This document defines the complete target architecture. Phase 1 implements only
the frontend against mock services; every other layer is specified here so the
boundaries are stable as later phases fill them in.

---

## 1. Architectural principle: normalize, then evaluate once

ANCP is deliberately **not** built as separate per-vendor systems. It converts
heterogeneous vendor configurations into one vendor-neutral model, then runs a
single compliance architecture over that model.

```
Vendor Configuration
        ↓
Vendor-aware Parsing
        ↓
Common Normalization Model   ← the pivot point
        ↓
Security Controls (deterministic + AI-assisted)
        ↓
Framework Correlation (CIS / NIST / STIG / ISO)
```

Because vendors are **data, not code branches**, adding Arista / Palo Alto /
SONiC later means adding a vendor definition + parser, not a new subsystem.

---

## 2. End-to-end workflow

```
Network Infrastructure
   ├── Configuration File (.txt/.cfg/.conf)
   └── Live Device (SSH / Netmiko)
        ↓
Vendor Identification → Cisco IOS | Junos | FortiOS | …
        ↓
Configuration Parsing → Normalization → Vendor-Neutral Model
        ↓
Known Pattern Detection
   ├── KNOWN   → Deterministic Rules
   └── UNKNOWN → AI Similarity → Human Review → Learned Pattern
        ↓
Security Findings → Framework Mapping → Risk Severity
        ↓
Evidence + Findings → Vendor-Specific Remediation
        ↓
Audit-Ready Reports (PDF / Excel)
```

---

## 3. Repository boundaries

| Directory | Responsibility | Phase |
|-----------|----------------|-------|
| `frontend/` | Next.js app; UI + mock service layer | **1** |
| `backend/` | FastAPI services, ingestion, parsing, normalization, AI, compliance, remediation, reporting, audit | 2+ |
| `shared/` | Cross-cutting contracts (OpenAPI, JSON Schema, Kafka event contracts) | 2+ |
| `knowledge-base/` | Learned patterns, rule packs, framework catalogs, canonical mappings | 6+ |
| `infrastructure/` | Docker, k8s, Terraform, CI | 10 |
| `docs/` | Architecture + traceability + testing | 1+ |
| `tests/` | Cross-service / e2e | 2+ |
| `scripts/` | Dev/ops tooling | — |

---

## 4. Frontend architecture (Phase 1)

```
frontend/
├── app/            # Next.js App Router routes (one folder per screen)
├── components/
│   ├── ui/         # shadcn-style primitives (Button, Card, Table, Tabs…)
│   ├── shared/     # domain widgets (badges, viewers, pipeline, score…)
│   ├── layout/     # AppShell, Sidebar, Header, Breadcrumb, Search, Notifications
│   └── charts/     # Recharts wrappers
├── services/       # service ABSTRACTION: interface.ts + mock.ts per domain
├── mock/           # realistic mock data
├── types/          # strongly-typed domain models (no `any`)
├── hooks/          # useAsync (service consumption)
├── lib/            # utils (cn, formatting, delay)
├── constants/      # design tokens + navigation + domain metadata
└── styles/         # global CSS + design token variables
```

### Service abstraction (the swap seam)

Every domain exposes a TypeScript `interface`. Phase 1 binds a `Mock*Service`
implementation in `services/index.ts`. Phase 3 replaces those bindings with
`Api*Service` implementations of the **same** interfaces — no UI/hook changes.

```
UI → hooks/useAsync → services registry → { Mock* (P1) | Api* (P3) } → interface
```

---

## 5. Deterministic + AI hybrid model

```
KNOWN                                 UNKNOWN
Known configuration                   Unknown configuration
   ↓                                     ↓
Deterministic parser                  Similarity / AI analysis
   ↓                                     ↓
Security fact                         Suggested interpretation (confidence %)
   ↓                                     ↓
Compliance rule                       Human review (approve / modify / reject)
                                         ↓
                                      Learned pattern → knowledge base
```

The AI never silently invents a compliance rule. Interpretations are surfaced
with a confidence score and require administrator approval before they join the
deterministic knowledge base. This human-in-the-loop learning loop is a core
product differentiator.

---

## 6. Canonical finding model (one finding → many frameworks)

A single normalized finding carries multiple `FrameworkMapping` references
(CIS / NIST / STIG / ISO). There are **not** four parallel finding systems.

```
Finding: "Telnet Enabled"
   ├── CIS  1.2.4
   ├── NIST AC-17(2)
   ├── STIG NET0405
   └── ISO  A.8.20
```

Every FAIL finding is evidence-backed: it stores the offending raw snippet, the
exact source line numbers, and the expected snippet for comparison.

---

## 7. Future backend mapping (Phase 2+)

| Frontend service interface | Future backend service |
|----------------------------|-------------------------|
| `DeviceService` | Device inventory API (PostgreSQL) |
| `ConfigurationService` | Ingestion (upload + SSH/Netmiko/NAPALM), parsing, normalization |
| `ComplianceService` | Compliance + framework correlation engine |
| `FindingService` | Findings store + query API |
| `TrainingService` | Embeddings + similarity + human-review workflow |
| `RemediationService` | Vendor-specific remediation generation |
| `ReportService` | PDF (WeasyPrint/ReportLab) + Excel (openpyxl) generation |
| `AuditService` | Immutable audit trail |

Async processing (parse/analyze/report) will run on Celery workers with Redis +
Kafka. None of this exists in Phase 1.

---

## 8. Security & data protection (UI-level in Phase 1)

- Credential & secret masking everywhere (`password ********`).
- Secure-upload indicator + sensitive-configuration warnings.
- No real credentials stored; the live-connect form is explicitly a prototype.
- Immutable audit trail surface for traceability.
