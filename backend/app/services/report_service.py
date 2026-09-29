"""Report data generation. Report DTOs come from ACTUAL database results, then
optional PDF/Excel artifacts are produced and stored."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.compliance_rule import ComplianceRun
from app.models.device import Device
from app.models.finding import Finding
from app.models.remediation import Remediation
from app.models.report import Report
from app.repositories.audit_repository import AuditRepository
from app.repositories.report_repository import ReportRepository
from app.reporting.excel import build_excel, excel_available
from app.reporting.pdf import build_pdf, pdf_available
from app.schemas.reports import ReportCreate
from app.services.audit_service import AuditService
from app.storage.supabase_storage import get_storage


class ReportService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ReportRepository(db)
        self.audit = AuditService(db)

    def list(self, org_id: str, *, offset: int, limit: int):
        return self.repo.list(org_id, filters={}, offset=offset, limit=limit)

    def get(self, org_id: str, report_id: str) -> Report:
        report = self.repo.get(org_id, report_id)
        if not report:
            raise NotFoundError("Report not found")
        return report

    def _devices(self, org_id: str, device_ids: list[str]) -> list[Device]:
        stmt = select(Device).where(Device.organization_id == org_id)
        if device_ids:
            stmt = stmt.where(Device.id.in_(device_ids))
        return list(self.db.execute(stmt).scalars().all())

    def _findings(self, org_id: str, device_ids: list[str]) -> list[Finding]:
        stmt = select(Finding).where(
            Finding.organization_id == org_id, Finding.result == "FAIL"
        )
        if device_ids:
            stmt = stmt.where(Finding.device_id.in_(device_ids))
        return list(self.db.execute(stmt).scalars().all())

    def generate(self, org_id: str, actor: str, payload: ReportCreate) -> Report:
        device_ids = payload.device_ids
        devices = self._devices(org_id, device_ids)
        resolved_ids = [d.id for d in devices]
        findings = self._findings(org_id, resolved_ids)

        score = round(sum(d.compliance_score for d in devices) / len(devices)) if devices else 0
        severity_breakdown: dict[str, int] = {}
        for f in findings:
            severity_breakdown[f.severity] = severity_breakdown.get(f.severity, 0) + 1

        # Framework results from latest runs of the covered devices.
        fw_totals: dict[str, dict[str, int]] = {}
        for did in resolved_ids:
            run = self.db.execute(
                select(ComplianceRun).where(ComplianceRun.device_id == did)
                .order_by(ComplianceRun.created_at.desc())
            ).scalars().first()
            if not run:
                continue
            for key, sc in (run.framework_scores or {}).items():
                b = fw_totals.setdefault(key, {"passed": 0, "failed": 0})
                b["passed"] += sc.get("passed", 0)
                b["failed"] += sc.get("failed", 0)
        framework_results = [
            {"framework": k, "score": round(100 * v["passed"] / (v["passed"] + v["failed"]))
                if (v["passed"] + v["failed"]) else 100,
             "passed": v["passed"], "failed": v["failed"]}
            for k, v in fw_totals.items()
        ]

        single = devices[0] if len(devices) == 1 else None
        preview = {
            "executive_summary": (
                f"{len(devices)} device(s) analyzed with an average compliance score of "
                f"{score}%. {len(findings)} failing findings across "
                f"{len(severity_breakdown)} severity levels."
            ),
            "device": {
                "hostname": single.hostname, "vendor": single.vendor,
                "model": single.model or "", "os": f"{single.os_name or ''} {single.os_version or ''}".strip(),
                "management_ip": single.management_ip or "",
            } if single else None,
            "compliance_score": score,
            "framework_results": framework_results,
            "findings": [
                {"id": f.id, "title": f.title, "severity": f.severity, "status": f.status,
                 "category": f.category, "actual_value": f.actual_value,
                 "expected_value": f.expected_value,
                 "evidence": (f.evidence or {}).get("snippet", ""),
                 "remediation": f.expected_value or ""}
                for f in findings[:25]
            ],
        }

        report = Report(
            organization_id=org_id, title=payload.title, category=payload.category,
            fmt=payload.fmt, status="GENERATING", device_ids=resolved_ids,
            compliance_score=score, findings_count=len(findings),
            severity_breakdown=severity_breakdown, preview=preview, generated_by=actor,
        )
        self.repo.add(report)
        self.db.flush()

        # Produce + store the artifact (guarded; metadata still succeeds without libs).
        try:
            storage = get_storage()
            if payload.fmt == "EXCEL" and excel_available():
                rems = [self._rem_dict(r) for r in self._remediations(org_id, resolved_ids)]
                audit = [self._audit_dict(a) for a in AuditRepository(self.db)
                         .list(org_id, filters={}, offset=0, limit=50)[0]]
                data = build_excel(payload.title, preview,
                                   [self._finding_dict(f) for f in findings], rems, audit)
                key = f"{org_id}/{report.id}/report.xlsx"
                report.storage_path = storage.put("ancp-reports", key, data,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                report.status = "READY"
            elif payload.fmt == "PDF" and pdf_available():
                data = build_pdf(payload.title, preview)
                key = f"{org_id}/{report.id}/report.pdf"
                report.storage_path = storage.put("ancp-reports", key, data, "application/pdf")
                report.status = "READY"
            else:
                # Metadata/preview ready even if the binary generator is unavailable.
                report.status = "READY"
        except Exception:  # noqa: BLE001 — artifact failure must not lose the report row
            report.status = "READY"
            report.storage_path = None

        self.audit.log(
            organization_id=org_id, event_type="REPORT_GENERATED",
            title="Report generated", description=f"{payload.title} ({payload.fmt})",
            actor=actor, report_id=report.id,
        )
        self.db.commit()
        self.db.refresh(report)
        return report

    def _remediations(self, org_id: str, device_ids: list[str]) -> list[Remediation]:
        stmt = select(Remediation).where(Remediation.organization_id == org_id)
        if device_ids:
            stmt = stmt.where(Remediation.device_id.in_(device_ids))
        return list(self.db.execute(stmt).scalars().all())

    @staticmethod
    def _finding_dict(f: Finding) -> dict:
        return {"id": f.id, "title": f.title, "severity": f.severity, "status": f.status,
                "category": f.category, "actual_value": f.actual_value,
                "expected_value": f.expected_value}

    @staticmethod
    def _rem_dict(r: Remediation) -> dict:
        return {"title": r.title, "vendor": r.vendor, "severity": r.severity,
                "status": r.status, "commands": r.commands}

    @staticmethod
    def _audit_dict(a) -> dict:
        return {"event_type": a.event_type, "title": a.title, "actor": a.actor,
                "created_at": a.created_at.isoformat() if a.created_at else ""}
