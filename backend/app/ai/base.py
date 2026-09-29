"""AI provider abstraction.

The rest of the backend depends ONLY on this interface, never on a concrete
vendor (OpenAI/Gemini/etc.). A local, deterministic provider ships by default
so the platform is fully testable offline. Providers may SUGGEST, CLASSIFY, or
find SIMILARITY — they never approve compliance, mutate rules, or execute
remediation. Human approval gates learned patterns.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class SimilarPattern:
    pattern_id: str
    snippet: str
    similarity: float
    vendor: str | None = None
    category: str | None = None


@dataclass
class PatternAnalysis:
    interpretation: str
    suggested_category: str
    suggested_field: str
    confidence: float
    similar_patterns: list[SimilarPattern] = field(default_factory=list)
    provider: str = "local"


class AIProvider(ABC):
    name: str = "base"

    @abstractmethod
    def generate_pattern_embedding(self, text: str) -> list[float]:
        ...

    @abstractmethod
    def classify_pattern(self, text: str) -> tuple[str, str, float]:
        """Return (category, normalized_field, confidence)."""

    @abstractmethod
    def analyze_unknown_pattern(
        self, text: str, corpus: list[dict]
    ) -> PatternAnalysis:
        """Interpret an unknown pattern using a corpus of known patterns.

        `corpus` items: {"id","snippet","category","field","vendor"}.
        """
