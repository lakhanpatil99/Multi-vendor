"""Compliance engine — orchestrates deterministic evaluation.

Consumes ONLY the vendor-neutral model + facts. Contains no vendor branching.
Produces per-rule outcomes (with framework correlation + evidence) and the
aggregate scores used for the compliance run and dashboards.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.compliance.evaluator import EvalResult, evaluate_rule, find_evidence
from app.compliance.rule_loader import RuleDef
from app.normalization.evidence import FactData


@dataclass
class RuleOutcome:
    rule: RuleDef
    result: EvalResult
    evidence: FactData | None


@dataclass
class ComplianceReport:
    outcomes: list[RuleOutcome] = field(default_factory=list)
    overall_score: int = 0
    total: int = 0
    passed: int = 0
    failed: int = 0
    not_applicable: int = 0
    unknown: int = 0
    framework_scores: dict[str, dict] = field(default_factory=dict)


class ComplianceEngine:
    def evaluate(
        self, model: dict, facts: list[FactData], rules: list[RuleDef]
    ) -> ComplianceReport:
        report = ComplianceReport()
        # framework_key -> {"pass": n, "fail": n}
        fw: dict[str, dict[str, int]] = {}

        for rule in rules:
            res = evaluate_rule(rule, model)
            evidence = find_evidence(facts, rule.target_field)
            report.outcomes.append(RuleOutcome(rule=rule, result=res, evidence=evidence))

            if res.result == "PASS":
                report.passed += 1
            elif res.result == "FAIL":
                report.failed += 1
            elif res.result == "N/A":
                report.not_applicable += 1
            else:
                report.unknown += 1

            # Framework correlation only counts decisive (PASS/FAIL) outcomes.
            if res.result in {"PASS", "FAIL"}:
                for m in rule.mappings:
                    bucket = fw.setdefault(m.framework, {"pass": 0, "fail": 0})
                    bucket["pass" if res.result == "PASS" else "fail"] += 1

        report.total = len(rules)
        decisive = report.passed + report.failed
        report.overall_score = round(100 * report.passed / decisive) if decisive else 100

        for key, counts in fw.items():
            total = counts["pass"] + counts["fail"]
            report.framework_scores[key] = {
                "passed": counts["pass"],
                "failed": counts["fail"],
                "score": round(100 * counts["pass"] / total) if total else 100,
            }
        return report
