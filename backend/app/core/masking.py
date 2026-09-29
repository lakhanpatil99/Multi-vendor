"""Secret masking / credential redaction for configuration content.

Applied at INGESTION before any raw configuration is persisted (sanitized
copy), analyzed, logged, or returned via the API. Masking is idempotent and
preserves line structure (and therefore evidence line numbers).
"""
from __future__ import annotations

import re

MASK = "********"

# Ordered rules cover Cisco IOS, Juniper Junos, and FortiOS credential syntaxes.
_RULES: list[re.Pattern[str]] = [
    # Cisco: "password 7 xxxx", "secret 5 xxxx", "password 0 xxxx"
    re.compile(r"(?i)((?:enable\s+)?(?:password|secret)\s+\d+\s+)(\S+)"),
    # Cisco: "password <plain>", "secret <plain>" (no level).
    # Negative lookbehind avoids clobbering FortiOS "set password ENC ..." here.
    re.compile(r"(?i)(?<!set )((?:enable\s+)?(?:password|secret)\s+)(?!\d+\s)(\S+)"),
    # Cisco: SNMP community strings
    re.compile(r"(?i)(snmp-server\s+community\s+)(\S+)"),
    # Cisco: pre-shared / crypto keys
    re.compile(r"(?i)((?:pre-shared-key|key)\s+(?:\d+\s+)?)(\S+)"),
    # Junos: encrypted-password "xxx"  /  secret "xxx"
    re.compile(r'(?i)((?:encrypted-password|secret)\s+)"[^"]*"'),
    # Junos: authentication-key / ssh keys
    re.compile(r'(?i)((?:authentication-key)\s+)"[^"]*"'),
    # FortiOS: set password ENC xxxx  /  set passwd xxxx  /  set psksecret xxx
    re.compile(r"(?i)(set\s+(?:password|passwd|psksecret|private-key|passphrase)\s+(?:ENC\s+)?)(\S+)"),
    # FortiOS/general: SNMP community in block form
    re.compile(r'(?i)(set\s+community\s+)"?[^"\n]*"?'),
]

_QUOTED = {4, 5, 7}  # rule indexes whose secret is a quoted/segment replace


def mask_secrets(text: str) -> str:
    """Return a copy of `text` with credential material replaced by MASK.

    Line count and non-secret tokens are preserved so evidence line numbers
    remain valid against the sanitized content.
    """
    masked = text
    for idx, rule in enumerate(_RULES):
        if idx in _QUOTED:
            masked = rule.sub(lambda m: f'{m.group(1)}"{MASK}"', masked)
        else:
            masked = rule.sub(lambda m: f"{m.group(1)}{MASK}", masked)
    return masked


def contains_secret_markers(text: str) -> bool:
    """Heuristic: does the text still appear to contain credential material?"""
    return any(rule.search(text) for rule in _RULES)
