# AI Network Compliance Platform (ANCP)

> AI-driven multi-vendor network security compliance auditing and hardening platform.

ANCP converts heterogeneous network configurations (Cisco IOS, Juniper Junos, FortiOS, and more)
into a common security understanding, evaluates them across multiple compliance frameworks
(CIS, NIST SP 800-53, DISA STIG, ISO/IEC 27001), learns unfamiliar patterns through human
feedback, provides evidence-backed findings and vendor-specific remediation, and produces
audit-ready reports.

Based on **SIH26155 — AI-Driven Multi-Vendor Network Security Compliance Auditor**.

---

## Development Strategy (Phased)

```
PHASE 1  Architecture + Complete Frontend            <-- CURRENT
PHASE 2  Backend + Database + API Architecture
PHASE 3  Frontend <-> Backend Integration
PHASE 4  Configuration Ingestion + Vendor Detection
PHASE 5  Configuration Parsing + Normalization
PHASE 6  AI-Assisted Pattern Recognition + Human Training
PHASE 7  Compliance + Framework Correlation Engine
PHASE 8  Findings + Risk + Remediation
PHASE 9  PDF + Excel Reporting + Audit Trail
PHASE 10 Security + Testing + Performance + Deployment
```

## Repository Layout

```
ai-network-compliance/
├── frontend/          # Phase 1 primary deliverable — Next.js app (mock services)
├── backend/           # Phase 2+ — FastAPI service (architecture placeholder)
├── shared/            # Cross-cutting contracts/schemas shared FE<->BE
├── knowledge-base/    # Learned patterns, rule packs, framework mappings (placeholder)
├── infrastructure/    # IaC, docker, deployment (placeholder)
├── docs/              # Architecture + traceability documentation
├── tests/             # Cross-cutting / e2e test placeholders
└── scripts/           # Dev/ops scripts (placeholder)
```

## Phase 1 Status

| Area | Status |
|------|--------|
| Architecture | COMPLETE |
| Frontend | COMPLETE |
| Mock Service Layer | COMPLETE |
| Mock Data | COMPLETE |
| Routes | COMPLETE |
| UI/UX | COMPLETE |
| Backend | NOT IMPLEMENTED |
| Database | NOT IMPLEMENTED |
| Real AI | NOT IMPLEMENTED |
| Real SSH/Netmiko | NOT IMPLEMENTED |
| Real Compliance Engine | NOT IMPLEMENTED |
| Real Remediation | NOT IMPLEMENTED |

## Deployment

The web application lives in **`/frontend`** (Next.js + TypeScript). This is a
monorepo, so Vercel must treat `/frontend` as the project root.

### Local Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Production Test

```bash
cd frontend
npm install
npm run build
npm run start
```

Then open http://localhost:3000

### Vercel Deployment

The Vercel project must use:

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Install Command | `npm install` |
| Output Directory | (leave default — Next.js managed) |

Setting the **Root Directory** to `frontend` is what resolves the `404: NOT_FOUND`
deployment: the app is not at the repo root, so Vercel must be pointed at it. The
deployment then uses the Next.js output automatically — no `vercel.json` or custom
output directory required. See [docs/deployment.md](./docs/deployment.md) for details.

> The frontend does not currently read any environment variables, so no
> `.env.example` is required. Add one only when real variables are introduced.
