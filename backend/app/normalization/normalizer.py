"""Normalization engine.

Converts a `ParsedConfiguration` (vendor-neutral facts + evidence) into:
  * a nested vendor-neutral security `model` dict, and
  * a flat list of `FactData` (persisted as NormalizedFact rows), and
  * a list of `UnknownData` for the AI/human training workflow.

Pure and deterministic — no DB, no vendor branching.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.normalization.evidence import FactData, UnknownData
from app.normalization.mapper import set_nested
from app.normalization.schema import category_for, label_for, value_type_for
from app.parsers.base import ParsedConfiguration


@dataclass
class NormalizedResult:
    model: dict
    facts: list[FactData]
    unknown: list[UnknownData]


class Normalizer:
    schema_version = "1.0"

    def normalize(self, parsed: ParsedConfiguration) -> NormalizedResult:
        model: dict = {
            "identity": {
                "vendor": parsed.vendor,
                "os": parsed.os,
            }
        }
        facts: list[FactData] = []

        for pf in parsed.facts:
            value = pf.value
            value_type = value_type_for(pf.field)
            # Coerce booleans/strings to a stable string representation for the
            # NormalizedFact row while keeping the native value in the model.
            str_value = _to_str(value)
            set_nested(model, pf.field, value)
            facts.append(
                FactData(
                    field=pf.field,
                    category=category_for(pf.field),
                    label=label_for(pf.field),
                    value=str_value,
                    value_type=value_type,
                    origin="DETERMINISTIC",
                    confidence=1.0,
                    line_start=pf.evidence.line_start,
                    line_end=pf.evidence.line_end,
                    snippet=pf.evidence.snippet,
                )
            )

        unknown = [
            UnknownData(
                snippet=u.snippet,
                line_start=u.evidence.line_start,
                line_end=u.evidence.line_end,
                hint=u.hint,
            )
            for u in parsed.unknown
        ]
        return NormalizedResult(model=model, facts=facts, unknown=unknown)


def _to_str(value) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)
