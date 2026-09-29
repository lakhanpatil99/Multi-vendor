"""Analysis pipeline service.

Runs the full deterministic pipeline for one configuration, updating the job's
per-stage status and emitting audit events. Vendor-specific logic is confined
to the parser; everything after consumes only the neutral model.

Pipeline: validate → detect vendor/os → parse → normalize → evidence →
unknown-pattern detection (+AI suggestion) → compliance → findings → risk →
remediation → persist → audit → complete.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.ai.provider import get_ai_provider
from app.compliance.engine import ComplianceEngine
from app.compliance.risk import device_risk_level, finding_risk
from app.compliance.rule_loader import load_rules
from app.core.exceptions import ParsingError
from app.models.compliance_rule import ComplianceRun
from app.models.configuration import Configuration, NormalizedConfiguration
from app.models.finding import Finding
from app.models.job import AnalysisJob
from app.models.normalized_fact import NormalizedFact
from app.models.remediation import Remediation
from app.models.training_pattern import AIAnalysis, TrainingPattern
from app.normalization.normalizer import Normalizer
from app.parsers.registry import get_parser, supported_vendors
from app.repositories.configuration_repository import ConfigurationRepository
from app.repositories.device_repository import DeviceRepository
from app.repositories.finding_repository import FindingRepository
from app.services.audit_service import AuditService
from app.services.vendor_detection_service import VendorDetectionService

_STAGES = [
    ("validate", "Validate"),
    ("detect_vendor", "Detect Vendor"),
    ("detect_os", "Detect OS"),
    ("parse", "Parse"),
    ("normalize", "Normalize"),
    ("detect_unknown", "Unknown Pattern Detection"),
    ("ai_analysis", "AI Analysis"),
    ("compliance", "Compliance Check"),
    ("findings", "Generate Findings"),
    ("remediation", "Remediation"),
    ("persist", "Persist Results"),
]


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AnalysisService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.configs = ConfigurationRepository(db)
        self.devices = DeviceRepository(db)
        self.findings = FindingRepository(db)
        self.audit = AuditService(db)
        self.detector = VendorDetectionService()
        self.normalizer = Normalizer()
        self.engine = ComplianceEngine()
        self.ai = get_ai_provider()

    # ── job scaffolding ──────────────────────────────────────────
    def create_job(self, org_id: str, config_id: str) -> AnalysisJob:
        job = AnalysisJob(
            organization_id=org_id,
            job_type="ANALYSIS",
            resource_type="configuration",
            resource_id=config_id,
            status="QUEUED",
            progress=0,
            stages=[{"id": s, "label": lbl, "status": "PENDING"} for s, lbl in _STAGES],
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def _set_stage(self, job: AnalysisJob, stage_id: str, status: str, detail: str | None = None) -> None:
        stages = job.stages
        for i, s in enumerate(stages):
            if s["id"] == stage_id:
                s["status"] = status
                if detail:
                    s["detail"] = detail
                job.current_stage = stage_id
                job.progress = round(100 * (i + 1) / len(stages))
                break
        job.stages = list(stages)
        self.db.add(job)
        self.db.flush()

    # ── pipeline ─────────────────────────────────────────────────
    def run(self, org_id: str, actor: str, config_id: str, job: AnalysisJob) -> dict:
        job.status = "RUNNING"
        job.started_at = _now()
        self.db.add(job)
        self.db.flush()
        try:
            result = self._pipeline(org_id, actor, config_id, job)
            job.status = "COMPLETED"
            job.progress = 100
            job.completed_at = _now()
            job.result = result
            self.db.add(job)
            self.db.commit()
            return result
        except Exception as exc:  # noqa: BLE001
            self.db.rollback()
            job = self.db.get(AnalysisJob, job.id)
            if job:
                job.status = "FAILED"
                job.error = str(exc)[:500]
                job.completed_at = _now()
                self.db.add(job)
                self.db.commit()
            raise

    def _pipeline(self, org_id: str, actor: str, config_id: str, job: AnalysisJob) -> dict:
        config = self.configs.get(org_id, config_id)
        if not config:
            raise ParsingError("Configuration not found")

        content = config.sanitized_content or ""
        self._set_stage(job, "validate", "COMPLETE", f"{config.line_count} lines")

        detection = self.detector.detect(content)
        vendor = detection.vendor
        self._set_stage(job, "detect_vendor", "COMPLETE",
                        f"{vendor} ({detection.confidence})")
        self._set_stage(job, "detect_os", "COMPLETE", detection.os)

        if vendor not in supported_vendors():
            config.parser_status = "FAILED"
            config.analysis_status = "NEEDS_REVIEW"
            self._set_stage(job, "parse", "FAILED", "Unsupported vendor")
            self.db.commit()
            raise ParsingError(f"No parser for detected vendor '{vendor}'")

        parsed = get_parser(vendor).parse(content)
        config.parser_status = "PARSED"
        self._set_stage(job, "parse", "COMPLETE", f"{len(parsed.facts)} facts")

        norm = self.normalizer.normalize(parsed)
        self.configs.clear_analysis(org_id, config_id)
        for f in norm.facts:
            self.db.add(NormalizedFact(
                organization_id=org_id, configuration_id=config_id,
                category=f.category, field=f.field, label=f.label, value=f.value,
                value_type=f.value_type, origin=f.origin, confidence=f.confidence,
                line_start=f.line_start, line_end=f.line_end, snippet=f.snippet,
            ))
        self.db.add(NormalizedConfiguration(
            organization_id=org_id, configuration_id=config_id, model=norm.model,
            schema_version=self.normalizer.schema_version,
        ))
        config.normalization_status = "COMPLETE"
        # Refine device identity from the normalized model.
        device = self.devices.get(org_id, config.device_id) if config.device_id else None
        identity = norm.model.get("identity", {})
        if device:
            if identity.get("hostname"):
                device.hostname = identity["hostname"]
            device.vendor = vendor
            device.os_name = detection.os
            device.source = config.source
        self._set_stage(job, "normalize", "COMPLETE", "vendor-neutral model built")

        # ── unknown patterns + AI suggestion ──
        unknown_count = 0
        corpus = self._learned_corpus(org_id)
        for u in norm.unknown:
            unknown_count += 1
            analysis = self.ai.analyze_unknown_pattern(u.snippet, corpus)
            pattern = TrainingPattern(
                organization_id=org_id, vendor=vendor, os=detection.os,
                raw_pattern=u.snippet, normalized_field=analysis.suggested_field,
                security_category=analysis.suggested_category,
                extraction_strategy="ai_similarity",
                ai_confidence=analysis.confidence, status="PENDING", created_by="system",
            )
            self.db.add(pattern)
            self.db.flush()
            self.db.add(AIAnalysis(
                organization_id=org_id, pattern_id=pattern.id, provider=analysis.provider,
                interpretation=analysis.interpretation,
                suggested_category=analysis.suggested_category,
                suggested_field=analysis.suggested_field, confidence=analysis.confidence,
                similar_patterns=[{"pattern_id": s.pattern_id, "snippet": s.snippet,
                                   "similarity": s.similarity} for s in analysis.similar_patterns],
            ))
            self.audit.log(
                organization_id=org_id, event_type="UNKNOWN_PATTERN_CREATED",
                title="Unknown pattern queued", description=analysis.interpretation,
                actor="system", configuration_id=config_id, pattern_id=pattern.id,
            )
        self._set_stage(job, "detect_unknown", "COMPLETE", f"{unknown_count} unknown")
        self._set_stage(job, "ai_analysis", "COMPLETE",
                        f"{unknown_count} suggestions" if unknown_count else "0 unknown")
        self.audit.log(
            organization_id=org_id, event_type="AI_ANALYSIS_COMPLETED",
            title="AI analysis completed",
            description=f"{unknown_count} unknown patterns for {config.file_name}",
            actor="system", configuration_id=config_id,
        )

        # ── compliance (deterministic) ──
        rules = load_rules()
        rules_by_id = {r.rule_id: r for r in rules}
        report = self.engine.evaluate(norm.model, norm.facts, rules)
        # Per-category rollup (decisive outcomes only) for dashboards.
        category_scores: dict[str, dict] = {}
        for outcome in report.outcomes:
            if outcome.result.result not in {"PASS", "FAIL"}:
                continue
            bucket = category_scores.setdefault(
                outcome.rule.category, {"pass": 0, "fail": 0, "score": 0}
            )
            bucket["pass" if outcome.result.result == "PASS" else "fail"] += 1
        for bucket in category_scores.values():
            total = bucket["pass"] + bucket["fail"]
            bucket["score"] = round(100 * bucket["pass"] / total) if total else 100
        run = ComplianceRun(
            organization_id=org_id, device_id=config.device_id, configuration_id=config_id,
            overall_score=report.overall_score, total_rules=report.total,
            passed=report.passed, failed=report.failed,
            not_applicable=report.not_applicable, unknown=report.unknown,
            framework_scores=report.framework_scores, category_scores=category_scores,
            completed_at=_now(),
        )
        self.db.add(run)
        self.db.flush()
        self._set_stage(job, "compliance", "COMPLETE",
                        f"score {report.overall_score}%")
        self.audit.log(
            organization_id=org_id, event_type="COMPLIANCE_SCAN_COMPLETED",
            title="Compliance scan completed",
            description=f"{config.file_name} scored {report.overall_score}%",
            actor="system", configuration_id=config_id, device_id=config.device_id,
        )

        # ── findings + remediation + risk ──
        self.findings.delete_for_configuration(org_id, config_id)
        fail_summ: list[dict] = []
        findings_created = 0
        remediations_created = 0
        for outcome in report.outcomes:
            if outcome.result.result != "FAIL":
                continue
            rule = rules_by_id[outcome.rule.rule_id]
            fw = [{"framework": m.framework, "control_id": m.control_id,
                   "control_title": m.control_title} for m in rule.mappings]
            risk = finding_risk(rule.severity, len(rule.mappings))
            ev = outcome.evidence
            evidence = {
                "configuration_id": config_id,
                "line_start": ev.line_start if ev else None,
                "line_end": ev.line_end if ev else None,
                "snippet": ev.snippet if ev else None,
            }
            finding = Finding(
                organization_id=org_id, device_id=config.device_id,
                configuration_id=config_id, run_id=run.id, rule_id=rule.rule_id,
                title=rule.title, description=rule.description, category=rule.category,
                severity=rule.severity, status="OPEN", result="FAIL",
                actual_value=outcome.result.actual_value,
                expected_value=outcome.result.expected_value,
                security_impact=rule.security_impact, risk_score=risk.score,
                evidence=evidence, frameworks=fw,
                verification=[f"Confirm {rule.target_field} satisfies rule {rule.rule_id}"],
                detected_at=_now(),
            )
            self.db.add(finding)
            self.db.flush()
            findings_created += 1
            fail_summ.append({"severity": rule.severity, "risk_score": risk.score})
            self.audit.log(
                organization_id=org_id, event_type="FINDING_CREATED",
                title="Finding created", description=rule.title, severity=rule.severity,
                actor="system", configuration_id=config_id, device_id=config.device_id,
                finding_id=finding.id,
            )
            # Remediation generation (never executed).
            from app.remediation.generator import generate
            gen = generate(
                vendor=vendor, os=detection.os, category=rule.category,
                severity=rule.severity, finding_title=rule.title,
                current_value=outcome.result.actual_value or "",
                remediation_intent=rule.remediation_intent or "",
            )
            self.db.add(Remediation(
                organization_id=org_id, finding_id=finding.id, device_id=config.device_id,
                vendor=vendor, os=detection.os, category=rule.category,
                severity=rule.severity, title=gen.title,
                current_config=gen.current_config, expected_config=gen.expected_config,
                commands=gen.commands, verification_steps=gen.verification_steps,
                rollback_steps=gen.rollback_steps, disruptive=gen.disruptive,
                status="GENERATED", approval="PENDING",
            ))
            remediations_created += 1

        self._set_stage(job, "findings", "COMPLETE", f"{findings_created} findings")
        self._set_stage(job, "remediation", "COMPLETE", f"{remediations_created} remediations")

        # ── update device rollups ──
        if device:
            device.compliance_score = report.overall_score
            device.risk_level = device_risk_level(fail_summ)
            device.last_analysis_at = _now()
            device.status = "NEEDS_REVIEW" if unknown_count else "ANALYZED"
        config.analysis_status = "NEEDS_REVIEW" if unknown_count else "COMPLETE"
        self._set_stage(job, "persist", "COMPLETE", "results stored")

        return {
            "configuration_id": config_id,
            "device_id": config.device_id,
            "vendor": vendor,
            "os": detection.os,
            "compliance_score": report.overall_score,
            "findings_created": findings_created,
            "unknown_patterns": unknown_count,
            "run_id": run.id,
        }

    def _learned_corpus(self, org_id: str) -> list[dict]:
        from sqlalchemy import select

        rows = self.db.execute(
            select(TrainingPattern).where(
                TrainingPattern.organization_id == org_id,
                TrainingPattern.status == "APPROVED",
            )
        ).scalars().all()
        return [{"id": p.id, "snippet": p.raw_pattern,
                 "category": p.security_category, "field": p.normalized_field,
                 "vendor": p.vendor} for p in rows]
