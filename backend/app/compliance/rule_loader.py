"""Load declarative rules + framework metadata from YAML.

Used by the seed script to populate the DB, and by tests to evaluate directly.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml

_RULES_DIR = Path(__file__).parent / "rules"


@dataclass
class MappingDef:
    framework: str
    control_id: str
    control_title: str


@dataclass
class RuleDef:
    rule_id: str
    title: str
    category: str
    severity: str
    target_field: str
    operator: str
    expected_value: str | None
    on_missing: str
    description: str = ""
    security_impact: str = ""
    remediation_intent: str = ""
    mappings: list[MappingDef] = field(default_factory=list)


@dataclass
class FrameworkDef:
    key: str
    name: str
    version: str
    description: str


def load_rules() -> list[RuleDef]:
    data = yaml.safe_load((_RULES_DIR / "canonical.yaml").read_text(encoding="utf-8"))
    rules: list[RuleDef] = []
    for item in data:
        mappings = [MappingDef(**m) for m in item.get("mappings", [])]
        rules.append(
            RuleDef(
                rule_id=item["rule_id"],
                title=item["title"],
                category=item["category"],
                severity=item["severity"],
                target_field=item["target_field"],
                operator=item["operator"],
                expected_value=str(item["expected_value"]) if item.get("expected_value") is not None else None,
                on_missing=item.get("on_missing", "FAIL"),
                description=item.get("description", ""),
                security_impact=item.get("security_impact", ""),
                remediation_intent=item.get("remediation_intent", ""),
                mappings=mappings,
            )
        )
    return rules


def load_frameworks() -> list[FrameworkDef]:
    data = yaml.safe_load((_RULES_DIR / "frameworks.yaml").read_text(encoding="utf-8"))
    return [FrameworkDef(**item) for item in data]
