"""Local, deterministic hashing embedding (no external service).

A fixed-dimension bag-of-tokens hashing vector. Deterministic and offline; a
real embedding provider can replace this behind AIProvider later.
"""
from __future__ import annotations

import zlib

from app.ai.similarity import tokenize

DIM = 64


def _stable_hash(token: str) -> int:
    # crc32 is deterministic across processes (unlike str hash()).
    return zlib.crc32(token.encode("utf-8"))


def hashing_embedding(text: str, dim: int = DIM) -> list[float]:
    vec = [0.0] * dim
    for tok in tokenize(text):
        vec[_stable_hash(tok) % dim] += 1.0
    norm = sum(v * v for v in vec) ** 0.5
    if norm:
        vec = [v / norm for v in vec]
    return vec
