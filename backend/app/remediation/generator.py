"""Remediation generator.

Given a finding + the intended remediation, produce a vendor-specific
(simulated) remediation. EXECUTION IS DISABLED in this phase — the generator
only produces commands, verification, and rollback guidance.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.remediation.templates import get_template


@dataclass
class GeneratedRemediation:
    vendor: str
    os: str
    category: str
    severity: str
    title: str
    current_config: str
    expected_config: str
    commands: list[str]
    verification_steps: list[str]
    rollback_steps: list[str]
    disruptive: bool


def generate(
    *,
    vendor: str,
    os: str,
    category: str,
    severity: str,
    finding_title: str,
    current_value: str,
    remediation_intent: str,
) -> GeneratedRemediation:
    tpl = get_template(remediation_intent, vendor)
    return GeneratedRemediation(
        vendor=vendor,
        os=os,
        category=category,
        severity=severity,
        title=f"Remediate: {finding_title}",
        current_config=current_value or "(current non-compliant value)",
        expected_config=tpl.expected_config,
        commands=list(tpl.commands),
        verification_steps=list(tpl.verification),
        rollback_steps=list(tpl.rollback),
        disruptive=tpl.disruptive,
    )
