"""Compliance overview aggregation from the latest run per device."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.compliance_rule import ComplianceRun
from app.models.finding import Finding
from app.repositories.framework_repository import FrameworkRepository


class ComplianceService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.frameworks = FrameworkRepository(db)

    def _latest_runs(self, org_id: str) -> list[ComplianceRun]:
        runs = self.db.execute(
            select(ComplianceRun)
            .where(ComplianceRun.organization_id == org_id)
            .order_by(ComplianceRun.created_at.desc())
        ).scalars().all()
        latest: dict[str, ComplianceRun] = {}
        for run in runs:
            latest.setdefault(run.device_id, run)
        return list(latest.values())

    def overview(self, org_id: str) -> dict:
        runs = self._latest_runs(org_id)
        passed = sum(r.passed for r in runs)
        failed = sum(r.failed for r in runs)
        na = sum(r.not_applicable for r in runs)
        unknown = sum(r.unknown for r in runs)
        overall = round(sum(r.overall_score for r in runs) / len(runs)) if runs else 0

        # Framework aggregation.
        fw_totals: dict[str, dict[str, int]] = {}
        for run in runs:
            for key, sc in (run.framework_scores or {}).items():
                b = fw_totals.setdefault(key, {"passed": 0, "failed": 0})
                b["passed"] += sc.get("passed", 0)
                b["failed"] += sc.get("failed", 0)
        frameworks = []
        for fw in self.frameworks.list_frameworks():
            b = fw_totals.get(fw.key, {"passed": 0, "failed": 0})
            total = b["passed"] + b["failed"]
            frameworks.append({
                "framework": fw.key,
                "score": round(100 * b["passed"] / total) if total else 100,
                "passed": b["passed"],
                "failed": b["failed"],
            })

        # Category rollup aggregated from the latest runs' category_scores.
        cat_totals: dict[str, dict[str, int]] = {}
        for run in runs:
            for cat, sc in (run.category_scores or {}).items():
                b = cat_totals.setdefault(cat, {"pass": 0, "fail": 0})
                b["pass"] += sc.get("pass", 0)
                b["fail"] += sc.get("fail", 0)
        categories = []
        for cat, b in cat_totals.items():
            total = b["pass"] + b["fail"]
            categories.append({
                "category": cat,
                "pass": b["pass"],
                "fail": b["fail"],
                "score": round(100 * b["pass"] / total) if total else 100,
            })

        return {
            "overall_score": overall,
            "status_breakdown": {"pass": passed, "fail": failed, "na": na, "unknown": unknown},
            "frameworks": frameworks,
            "categories": categories,
        }
