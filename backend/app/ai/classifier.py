"""Keyword→category heuristic classifier for the local provider."""
from __future__ import annotations

# Ordered so more specific keywords win.
_KEYWORD_CATEGORY: list[tuple[tuple[str, ...], str, str]] = [
    (("ssh", "connection-limit", "rate-limit"), "SSH", "remote_access.ssh.hardening"),
    (("ssh",), "SSH", "remote_access.ssh.options"),
    (("telnet",), "TELNET", "remote_access.telnet.options"),
    (("snmp", "community"), "SNMP", "snmp.options"),
    (("ntp",), "NTP", "ntp.options"),
    (("login", "retry", "lockout", "block-for"), "AUTHENTICATION", "authentication.login.lockout"),
    (("aaa", "tacacs", "radius"), "AUTHENTICATION", "authentication.aaa.options"),
    (("logging", "syslog"), "LOGGING", "logging.options"),
    (("crypto", "certificate", "pki", "cipher", "tls"), "ENCRYPTION", "encryption.options"),
    (("policy", "firewall", "acl", "access-list"), "ACL_FIREWALL", "access_control.options"),
    (("password", "secret", "passwd"), "PASSWORD_SECURITY", "password_security.options"),
    (("management", "allowaccess", "gui"), "MANAGEMENT_ACCESS", "management_access.options"),
]


def classify(text: str) -> tuple[str, str, float]:
    low = text.lower()
    for keywords, category, field in _KEYWORD_CATEGORY:
        hits = sum(1 for k in keywords if k in low)
        if hits:
            confidence = min(0.95, 0.55 + 0.12 * hits)
            return category, field, round(confidence, 2)
    return "ACCESS_CONTROL", "unknown.field", 0.3
