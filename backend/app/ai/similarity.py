"""Deterministic text similarity used by the local AI provider."""
from __future__ import annotations

import math
import re

_TOKEN = re.compile(r"[a-z0-9\-]+")


def tokenize(text: str) -> list[str]:
    return _TOKEN.findall(text.lower())


def jaccard(a: str, b: str) -> float:
    sa, sb = set(tokenize(a)), set(tokenize(b))
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def cosine(vec_a: list[float], vec_b: list[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(x * y for x, y in zip(vec_a, vec_b))
    na = math.sqrt(sum(x * x for x in vec_a))
    nb = math.sqrt(sum(y * y for y in vec_b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)
