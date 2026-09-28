# Phase 1 — Verification & Testing

Phase 1 verification is workflow-based: a reviewer should be able to simulate
the full auditing story end-to-end using mock services.

## Build verification

```bash
cd frontend
npm install
npm run build      # type-checks + compiles all routes (must exit 0)
npm run dev        # http://localhost:3000
```

`npm run build` compiles all 21 routes and runs the TypeScript type checker.

## Route inventory (all must load)

```
/                          → redirects to /dashboard
/dashboard
/devices        /devices/[id]
/configurations /configurations/[id] /configurations/upload
/compliance     /frameworks
/findings       /findings/[id]
/ai-analysis    /training  /training/patterns
/remediation    /remediation/[id]
/reports        /reports/[id]
/audit          /settings
/_not-found
```

## Workflow walkthroughs

### 1. Device workflow
Dashboard → Devices → Device Details (Overview / Configuration / Normalized
Model / Compliance / Findings / Remediation / Reports / Audit tabs).

### 2. Configuration workflow
Upload → simulated processing pipeline (9 stages) → result summary → Device
analysis → Configuration Details → Normalized Model → Security Facts.

### 3. Compliance workflow
Compliance → control category → Findings (filtered) → Finding → Evidence
(found vs expected + highlighted source lines) → Framework Mapping.

### 4. AI workflow
Training Center → Unknown Pattern → AI Suggestion (confidence + similar
patterns) → Human Review (approve / modify / reject) → Learned Pattern.

### 5. Remediation workflow
Finding → Remediation → current-vs-expected diff → simulated vendor commands →
verification + rollback → approve / reject (never executed).

### 6. Reporting workflow
Findings/Devices → Reports → Generate → Report Preview (executive summary,
device info, compliance score, framework results, findings, evidence,
remediation, audit refs).

## Phase 1 success criteria (all simulated with mock services)

1. Upload Cisco configuration ✔ (`/configurations/upload`, Cisco sample)
2. Detect Cisco ✔ (pipeline "Detect Vendor" stage)
3. Parse configuration ✔ (pipeline "Parse" stage)
4. Display normalized configuration ✔ (Normalized Model)
5. Display security facts ✔ (Security Facts tab)
6. Run compliance simulation ✔ (Compliance Check stage → `/compliance`)
7. Generate findings ✔ (`/findings`)
8. Show exact configuration evidence ✔ (finding detail, highlighted lines)
9. Map finding to CIS/NIST/STIG/ISO ✔ (`/frameworks`, finding detail)
10. Generate vendor-specific remediation ✔ (`/remediation/[id]`)
11. Show unfamiliar configuration pattern ✔ (`/training`)
12. AI suggests interpretation ✔ (pattern card + review panel)
13. Administrator approves mapping ✔ (review approve/modify)
14. Pattern becomes learned ✔ (`/training/patterns`)
15. Generate compliance report ✔ (`/reports` → preview)
16. View audit trail ✔ (`/audit`, device Audit tab)

## Explicitly NOT implemented in Phase 1

Backend, PostgreSQL, Redis, Kafka, Celery, real FastAPI endpoints, real SSH /
Netmiko / NAPALM, real AI APIs / embeddings, real compliance evaluation, real
remediation execution, real PDF/Excel generation. All of the above are simulated
through the mock service layer.
