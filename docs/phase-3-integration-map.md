# Phase 3 — Integration Map

Frontend (Next.js) ↔ Backend (FastAPI `/api/v1`). The backend is the source of
truth. The frontend keeps its Phase 1 domain types; `lib/api/adapters.ts` maps
backend snake_case DTOs → those types. All calls go through `lib/api/client.ts`.

## Auth flow

- Backend `AUTH_MODE=dev` (default): `Authorization: Bearer <DEV_API_TOKEN>`
  (default `dev-local-token`) maps to the seeded ADMIN of the dev org. In
  `supabase` mode the same header carries a Supabase JWT.
- Frontend `AuthProvider` stores the token (localStorage `ancp.token`), restores
  the session via `GET /auth/me`, gates protected routes, and handles
  loading / authenticated / unauthenticated / expired (401) / forbidden (403) /
  backend-unavailable states. Logout clears the token.

## Environment

| Var | Example |
|-----|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api/v1` |

Only public/client-safe vars in the frontend. No service-role keys, DB creds, or
AI keys ever ship to the browser.

## Service → Endpoint → Consumer

| Frontend service | Method | Backend endpoint | UI consumer |
|---|---|---|---|
| Auth | `GET /auth/me` | auth.me | AuthProvider, header |
| ApiDeviceService | `list/get` | `GET /devices?page&page_size&vendor&device_type&status`, `GET /devices/{id}` | /devices, /devices/[id] |
| ApiConfigurationService | `list/get/getByDevice` | `GET /configurations`, `GET /configurations/{id}`, `GET /normalization/{id}` | /configurations, detail, device tabs |
| ApiConfigurationService | `upload/analyze/getJob` | `POST /configurations/upload`, `POST /configurations/{id}/analyze`, `GET /analysis/{job_id}` | /configurations/upload |
| ApiConfigurationService | `listVendors` | (static reference) | upload/connect forms |
| ApiConfigurationService | `connectionTest` | `POST /configurations/connect/test` | upload (connect mode) |
| ApiComplianceService | `overview/frameworks` | `GET /compliance`, `GET /frameworks` | /compliance, /dashboard |
| ApiFindingService | `list/get` | `GET /findings?...`, `GET /findings/{id}` | /findings, /findings/[id], device tab |
| ApiFindingService | `updateStatus` | `PATCH /findings/{id}` | finding detail |
| ApiTrainingService | `queueSummary/list/get/review` | `GET /training/patterns`, `.../approve`, `.../reject` | /training, /training/patterns, /ai-analysis, dashboard queue |
| ApiRemediationService | `list/get/getByFinding/decide` | `GET /remediation`, `GET /remediation/{id}`, `POST /remediation/{id}/decision` | /remediation, detail, device tab |
| ApiReportService | `list/get/generate` | `GET /reports`, `GET /reports/{id}`, `POST /reports` | /reports, /reports/[id] |
| ApiAuditService | `events/notifications` | `GET /audit?...` | /audit, device tab, notifications, dashboard |
| Frameworks detail | `getFramework` | `GET /frameworks/{key}` | /frameworks |

## Response envelope

Success `{ "data": ..., "meta": {...} }`; paginated `meta = {page,page_size,total,total_pages}`;
error `{ "error": {code,message,details} }`. The client unwraps `data`/`meta`
and throws a typed `ApiError` on non-2xx.

## Documented contract adjustments (interface extensions)

The Phase 1 `ConfigurationService.simulateIngestion(fileName, onStage)` was a
pure simulation. For real integration it is replaced by three explicit methods
(same service, extended interface):

- `upload(file: File, opts?) → Configuration`
- `analyze(configId) → { jobId, status }`
- `getJob(jobId) → AnalysisJob` (polled until COMPLETED/FAILED)

`runIngestion(file, onStage)` orchestrates upload→analyze→poll and drives the
existing `ProcessingPipeline` from the backend job's real `stages[]`. Job stages
map to the UI pipeline labels; progress reflects the backend `progress` field
(no fabricated percentages).

### Field-mapping notes (backend DTO → frontend type)

- Device: backend `vendor` (id) → `vendorId`+`vendorName`; `os_name`→`os`;
  `management_ip`→`ipAddress`. Backend `DeviceRead` has no per-status finding
  rollup, so `findingsSummary`/`criticalFindings`/`highFindings` default to 0 in
  list views; the **device detail** page derives accurate counts from the real
  findings query.
- Configuration: `sanitized_content`→`raw` (already secret-masked by backend —
  the raw file is never sent to the browser). `detected_vendor`→`vendorId`,
  `detected_os`→`os`. Normalized model + facts come from `GET /normalization/{id}`.
- Finding: `frameworks[]` (`framework`,`control_id`,`control_title`) →
  `FrameworkMapping`; `evidence` JSON (`snippet`,`line_start/end`) → `FindingEvidence`.
- Training: `security_category`→`suggestedCategory`, `normalized_field`→
  `suggestedField`, `ai_confidence`(0–1)→`confidence`(0–100). `KnowledgeQueueSummary`
  derived from pattern counts by status.
- Report: backend `fmt`→`format`; `preview.framework_results[{passed,failed}]`→
  `{pass,fail}`; `preview.findings[{actual_value/expected_value}]` mapped.

## No mock fallback

Once a page is connected it uses the API exclusively; API failures surface as
error states (never silent mock fallback). Static vendor **display** metadata
(names/accent colors) remains as UI constants — it is presentation, not data.

## Local running

```
# backend
cd backend && .\.venv\Scripts\activate && alembic upgrade head && python -m scripts.seed
uvicorn app.main:app --reload            # http://localhost:8000 ; /docs

# frontend
cd frontend && npm install
# .env.local: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
npm run dev                              # http://localhost:3000
```
