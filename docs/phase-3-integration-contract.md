# Phase 3 — Integration Contract (verified)

Frontend (Next.js) ↔ Backend (FastAPI `/api/v1`) ↔ Supabase. The backend is the
single source of truth. All frontend calls flow through
`lib/api/client.ts` → services → FastAPI. There is **no mock fallback** in the
production flow: API failures surface as real error states.

See also [phase-3-integration-map.md](./phase-3-integration-map.md) for the
field-mapping notes and contract adjustments.

## Service → Method → Endpoint → Auth → UI consumer

| Service | HTTP | Endpoint | Auth | UI consumer |
|---|---|---|---|---|
| Auth | GET | `/auth/me` | Bearer | AuthProvider, header |
| DeviceService.list/get | GET | `/devices`, `/devices/{id}` | Bearer (VIEWER+) | /devices, /devices/[id] |
| ConfigurationService.list/get | GET | `/configurations`, `/configurations/{id}`, `/normalization/{id}` | Bearer | /configurations, detail, device tabs |
| ConfigurationService.upload | POST (multipart) | `/configurations/upload` | Bearer (ANALYST+) | /configurations/upload |
| ConfigurationService.analyze | POST | `/configurations/{id}/analyze` | Bearer (ANALYST+) | upload workflow |
| ConfigurationService.getJob | GET | `/analysis/{job_id}` | Bearer | upload workflow (polling) |
| ConfigurationService.connectionTest | POST | `/configurations/connect/test` | Bearer (ANALYST+) | upload (connect mode) |
| ComplianceService.overview/frameworks | GET | `/compliance`, `/frameworks` | Bearer | /compliance, /dashboard |
| FindingService.list/get | GET | `/findings`, `/findings/{id}` | Bearer | /findings, /findings/[id], device tab |
| FindingService.updateStatus | PATCH | `/findings/{id}` | Bearer (ANALYST+) | finding detail |
| TrainingService.list/get | GET | `/training/patterns`, `/training/patterns/{id}` | Bearer | /training, /training/patterns, /ai-analysis |
| TrainingService.review | POST | `/training/patterns/{id}/approve`\|`/reject` | Bearer (ANALYST+) | Training Center |
| RemediationService.list/get | GET | `/remediation`, `/remediation/{id}` | Bearer | /remediation, detail, device tab |
| RemediationService.decide | POST | `/remediation/{id}/decision` | Bearer (ANALYST+) | remediation detail |
| ReportService.list/get/generate | GET/POST | `/reports`, `/reports/{id}`, `/reports` | Bearer | /reports, /reports/[id] |
| AuditService.events/notifications | GET | `/audit` | Bearer (AUDITOR+) | /audit, notifications, dashboard |
| Frameworks detail | GET | `/frameworks/{key}` | Bearer | /frameworks |

Response envelope: `{ "data": ..., "meta": {...} }`; paginated `meta =
{page,page_size,total,total_pages}` (backend `page_size` max **100**); error
`{ "error": {code,message,details} }`. The client unwraps and throws typed
`ApiError` (400/401/403/404/409/422/429/500/503 + backend-unavailable/timeout).

## Auth flow

`AuthProvider` (loading → authenticated | unauthenticated | unavailable),
token in `localStorage`, session restored via `/auth/me`, a global 401 clears
the session, `/login` gates protected routes. Backend enforces auth + RBAC +
organization isolation (frontend authorization is never trusted).

## Verified end-to-end (scripts/e2e_check.ps1, live backend)

```
auth/me                 role=ADMIN
upload cisco_insecure   vendor=cisco
analyze -> job          COMPLETED
poll job                findings=9  unknown=2  score=25
normalization           facts=15  remote_access.ssh.version=1
findings (device)       total=9  each mapped to CIS/NIST/STIG/ISO
compliance overview     overall=25  frameworks=4  categories=10
frameworks              CIS,NIST,STIG,ISO
remediation             commands generated (review-only, not executed)
training patterns       PENDING unknown patterns present
report (PDF)            status=READY from real findings
audit                   real events: CONFIGURATION_UPLOADED, VENDOR_DETECTED,
                        AI_ANALYSIS_COMPLETED, COMPLIANCE_SCAN_COMPLETED,
                        FINDING_CREATED, UNKNOWN_PATTERN_CREATED, REPORT_GENERATED
unauthenticated         /devices -> 401
```

No mock data participates in this flow.
