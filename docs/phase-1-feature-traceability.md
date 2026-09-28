# Phase 1 — Feature Traceability

Every frontend feature traces back to the actual problem
(SIH26155 — AI-Driven Multi-Vendor Network Security Compliance Auditor).

Format:

```
Problem Requirement → Product Feature → Frontend Screen → Future Backend Service
```

---

## Ingestion & multi-vendor support

| Problem Requirement | Product Feature | Frontend Screen(s) | Future Backend Service |
|---------------------|-----------------|--------------------|------------------------|
| Multi-vendor configuration | Device + Configuration inventory | `/devices`, `/configurations` | `DeviceService`, `ConfigurationService` |
| Configuration file upload | File ingestion workflow | `/configurations/upload` (Upload mode) | `ConfigurationService` (upload) |
| Live SSH-based collection | Connect-to-device workflow (prototype) | `/configurations/upload` (Connect mode) | `ConfigurationService` (SSH/Netmiko/NAPALM) |
| Vendor identification | Vendor detection stage + badges | Upload pipeline, `/devices` | Ingestion / vendor detector |
| Extensible vendors | Data-driven vendor definitions | `/settings` (Vendor Definitions) | Vendor registry |
| Vendor syntax differences | Syntax-aware raw viewer (flat/hierarchical/block) | Config `/configurations/[id]` (Raw tab) | Parsers |

## Parsing & normalization

| Problem Requirement | Product Feature | Frontend Screen(s) | Future Backend Service |
|---------------------|-----------------|--------------------|------------------------|
| Configuration parsing | Parser status + parsed facts | `/configurations`, `/configurations/[id]` | Parsing engine |
| Vendor-neutral normalization | Normalized model tree viewer | `/configurations/[id]` (Normalized tab), device Normalized tab | Normalization engine |
| Security facts extraction | Security Facts table | `/configurations/[id]` (Security Facts tab) | Normalization engine |

## AI & human-in-the-loop

| Problem Requirement | Product Feature | Frontend Screen(s) | Future Backend Service |
|---------------------|-----------------|--------------------|------------------------|
| AI-assisted unfamiliar-pattern recognition | Deterministic + AI hybrid view, AI suggestions | `/ai-analysis` | `TrainingService` (embeddings/similarity) |
| Human-in-the-loop learning | Training review (approve/modify/reject) | `/training` | `TrainingService` (review workflow) |
| Learned knowledge base | Learned patterns registry | `/training/patterns` | `TrainingService` + `knowledge-base/` |
| AI knowledge queue visibility | Dashboard AI Knowledge Queue card | `/dashboard` | `TrainingService` |

## Compliance & frameworks

| Problem Requirement | Product Feature | Frontend Screen(s) | Future Backend Service |
|---------------------|-----------------|--------------------|------------------------|
| Deterministic security rules | Control-category compliance | `/compliance` | Compliance engine |
| Framework correlation | One-finding → many-frameworks mapping | `/frameworks`, finding detail | Framework correlation engine |
| Multiple frameworks (CIS/NIST/STIG/ISO) | Framework scorecards + radar | `/dashboard`, `/compliance` | Framework catalogs (`knowledge-base/`) |
| Compliance state overview | Network Compliance Health + trend | `/dashboard`, `/compliance` | `ComplianceService` |

## Findings, evidence, remediation

| Problem Requirement | Product Feature | Frontend Screen(s) | Future Backend Service |
|---------------------|-----------------|--------------------|------------------------|
| Evidence-backed findings | Finding detail with evidence + highlighted config | `/findings`, `/findings/[id]` | `FindingService` |
| Severity classification | Severity badges + risk distribution | `/findings`, `/dashboard` | `FindingService` |
| Vendor-specific remediation | Remediation detail (diff + simulated commands) | `/remediation`, `/remediation/[id]` | `RemediationService` |
| Verification & rollback | Verification steps + rollback guidance | `/remediation/[id]` | `RemediationService` |

## Reporting & audit

| Problem Requirement | Product Feature | Frontend Screen(s) | Future Backend Service |
|---------------------|-----------------|--------------------|------------------------|
| PDF reporting | Report preview (PDF category) | `/reports`, `/reports/[id]` | `ReportService` (WeasyPrint/ReportLab) |
| Excel reporting | Report preview (Excel category) | `/reports` | `ReportService` (openpyxl) |
| Audit traceability | Audit timeline | `/audit`, device Audit tab | `AuditService` |

## Cross-cutting

| Problem Requirement | Product Feature | Frontend Screen(s) | Future Backend Service |
|---------------------|-----------------|--------------------|------------------------|
| Sensitive data protection | Credential/secret masking, secure-upload indicator | Upload, `/settings`, viewers | Secure credential handling |
| Discoverability | Global search (Ctrl+K) | App shell | Search API |
| Operational awareness | Notifications | App shell | Notification service |
