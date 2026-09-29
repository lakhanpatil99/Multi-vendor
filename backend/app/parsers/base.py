"""Parser contract + common intermediate representation.

ARCHITECTURAL BOUNDARY: all vendor-specific knowledge lives inside parsers.
A parser converts raw vendor configuration into a list of NEUTRAL-keyed
`ParsedFact`s (with line-level evidence) plus a list of unrecognized
`UnknownBlock`s. Nothing downstream (normalization, compliance, findings)
ever inspects vendor-native syntax again.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Evidence:
    """Line-level provenance for a parsed fact."""

    line_start: int
    line_end: int
    snippet: str


@dataclass
class ParsedFact:
    """A neutral security fact with evidence.

    `field` uses the vendor-neutral dotted path defined in
    normalization.schema (e.g. "remote_access.ssh.version").
    """

    field: str
    value: Any
    evidence: Evidence


@dataclass
class UnknownBlock:
    """A security-relevant line the parser could not confidently map.

    Fed into the AI-assisted unknown-pattern workflow for human review.
    """

    snippet: str
    evidence: Evidence
    hint: str | None = None


@dataclass
class ParsedConfiguration:
    vendor: str
    os: str
    lines: list[str]
    facts: list[ParsedFact] = field(default_factory=list)
    unknown: list[UnknownBlock] = field(default_factory=list)

    def add_fact(self, field_path: str, value: Any, line: int, snippet: str,
                 line_end: int | None = None) -> None:
        self.facts.append(
            ParsedFact(
                field=field_path,
                value=value,
                evidence=Evidence(line, line_end or line, snippet.strip()),
            )
        )

    def add_unknown(self, snippet: str, line: int, hint: str | None = None,
                    line_end: int | None = None) -> None:
        self.unknown.append(
            UnknownBlock(
                snippet=snippet.strip(),
                evidence=Evidence(line, line_end or line, snippet.strip()),
                hint=hint,
            )
        )


class BaseParser(ABC):
    """Interface every vendor parser implements."""

    vendor: str = "unknown"
    os: str = "unknown"
    syntax_style: str = "FLAT"

    @abstractmethod
    def parse(self, raw: str) -> ParsedConfiguration:  # pragma: no cover - abstract
        ...
