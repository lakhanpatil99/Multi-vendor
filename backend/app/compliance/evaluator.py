"""Deterministic rule evaluator.

CRITICAL: compliance decisions are made HERE, deterministically — never by an
LLM. Given a normalized model + a rule, the result (PASS/FAIL/N/A/UNKNOWN) is
fully reproducible.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.compliance.rule_loader import RuleDef
from app.normalization.evidence import FactData

_MISSING = object()


@dataclass
class EvalResult:
    rule_id: str
    result: str  # PASS / FAIL / N/A / UNKNOWN
    actual_value: str | None
    expected_value: str | None
    explanation: str


def _get(model: dict, dotted: str) -> Any:
    node: Any = model
    for part in dotted.split("."):
        if not isinstance(node, dict) or part not in node:
            return _MISSING
        node = node[part]
    return node


def _as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"true", "1", "yes", "enable", "enabled"}


def evaluate_rule(rule: RuleDef, model: dict) -> EvalResult:
    value = _get(model, rule.target_field)
    if value is _MISSING:
        outcome = rule.on_missing
        return EvalResult(
            rule.rule_id,
            outcome if outcome in {"PASS", "FAIL", "N/A", "UNKNOWN"} else "UNKNOWN",
            actual_value=None,
            expected_value=rule.expected_value,
            explanation=f"Field '{rule.target_field}' not present; on_missing={outcome}.",
        )

    actual = _fmt(value)
    op = rule.operator
    exp = rule.expected_value
    passed: bool

    if op == "equals":
        passed = actual == exp
    elif op == "not_equals":
        passed = actual != exp
    elif op == "is_true":
        passed = _as_bool(value)
    elif op == "is_false":
        passed = not _as_bool(value)
    elif op == "contains":
        passed = exp is not None and exp in actual
    elif op == "not_contains":
        passed = exp is None or exp not in actual
    elif op == "exists":
        passed = True
    elif op == "not_exists":
        passed = False
    else:  # unknown operator → cannot decide deterministically
        return EvalResult(rule.rule_id, "UNKNOWN", actual, exp,
                          f"Unsupported operator '{op}'.")

    return EvalResult(
        rule.rule_id,
        "PASS" if passed else "FAIL",
        actual_value=actual,
        expected_value=exp,
        explanation=f"{rule.target_field}={actual!r} {op} {exp!r} → {'PASS' if passed else 'FAIL'}",
    )


def _fmt(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, list):
        return ",".join(str(v) for v in value)
    return str(value)


def find_evidence(facts: list[FactData], target_field: str) -> FactData | None:
    for fact in facts:
        if fact.field == target_field:
            return fact
    return None
