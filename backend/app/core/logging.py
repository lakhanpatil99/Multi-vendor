"""Structured logging with request-id / job-id context.

CRITICAL: secrets are never logged. Raw configuration content is never passed
to the logger; only metadata (ids, sizes, statuses) is recorded. The
`redact()` helper is applied to any free-form string before logging.
"""
from __future__ import annotations

import json
import logging
import re
import sys
from contextvars import ContextVar

_request_id: ContextVar[str | None] = ContextVar("request_id", default=None)
_job_id: ContextVar[str | None] = ContextVar("job_id", default=None)

# Patterns that must never reach logs (defense in depth).
_SECRET_PATTERNS = [
    re.compile(r"(password|secret|passwd|pwd)\s+\S+", re.IGNORECASE),
    re.compile(r"(community)\s+\S+", re.IGNORECASE),
    re.compile(r"(ENC\s+)\S+", re.IGNORECASE),
    re.compile(r"(encrypted-password\s+)\S+", re.IGNORECASE),
    re.compile(r"(key\s+7\s+)\S+", re.IGNORECASE),
    re.compile(r"(Authorization:\s*Bearer\s+)\S+", re.IGNORECASE),
]


def redact(text: str) -> str:
    """Mask anything that looks like a credential/secret in a log string."""
    out = text
    for pat in _SECRET_PATTERNS:
        out = pat.sub(lambda m: f"{m.group(1)} ********", out)
    return out


def set_request_id(value: str | None) -> None:
    _request_id.set(value)


def set_job_id(value: str | None) -> None:
    _job_id.set(value)


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "level": record.levelname,
            "logger": record.name,
            "message": redact(record.getMessage()),
        }
        rid = _request_id.get()
        jid = _job_id.get()
        if rid:
            payload["request_id"] = rid
        if jid:
            payload["job_id"] = jid
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def configure_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level.upper())


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
