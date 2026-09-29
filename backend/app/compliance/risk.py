"""Deterministic, explainable risk scoring.

No random/AI scores. Risk is a reproducible function of severity, the number
of affected framework controls, and (optionally) asset criticality.
"""
from __future__ import annotations

from dataclasses import dataclass

_SEVERITY_BASE = {
    "CRITICAL": 90,
    "HIGH": 70,
    "MEDIUM": 45,
    "LOW": 20,
    "INFO": 5,
}

_CRITICALITY_MULT = {"high": 1.15, "medium": 1.0, "low": 0.9}


@dataclass
class RiskResult:
    score: int
    explanation: str


def finding_risk(severity: str, framework_count: int, criticality: str = "medium") -> RiskResult:
    base = _SEVERITY_BASE.get(severity.upper(), 30)
    # Each additional affected framework adds weight (capped) — broader impact.
    framework_bonus = min(max(framework_count - 1, 0), 3) * 3
    mult = _CRITICALITY_MULT.get(criticality.lower(), 1.0)
    score = int(min(100, round((base + framework_bonus) * mult)))
    explanation = (
        f"base({severity}={base}) + frameworks({framework_count}->+{framework_bonus}) "
        f"x criticality({criticality}={mult}) = {score}"
    )
    return RiskResult(score=score, explanation=explanation)


def device_risk_level(fail_findings: list[dict]) -> str:
    """Aggregate device risk from its failing findings.

    Each item: {"severity": str, "risk_score": int}.
    """
    if not fail_findings:
        return "MINIMAL"
    severities = {f["severity"].upper() for f in fail_findings}
    if "CRITICAL" in severities:
        return "CRITICAL"
    if "HIGH" in severities:
        return "HIGH"
    if "MEDIUM" in severities:
        return "MEDIUM"
    if "LOW" in severities:
        return "LOW"
    return "MINIMAL"
