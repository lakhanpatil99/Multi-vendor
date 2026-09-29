"""Vendor-neutral security model schema.

Defines the canonical dotted field paths, their control category, and a human
label. Parsers emit these fields; the compliance engine evaluates them. The
schema is intentionally extensible — adding a field here (plus parser support)
does not require touching the compliance engine.
"""
from __future__ import annotations

# Control categories (align with the frontend design system).
CATEGORIES = [
    "AUTHENTICATION",
    "SSH",
    "TELNET",
    "LOGGING",
    "ACL_FIREWALL",
    "NTP",
    "SNMP",
    "ENCRYPTION",
    "MANAGEMENT_ACCESS",
    "PASSWORD_SECURITY",
    "SESSION_MANAGEMENT",
    "ACCESS_CONTROL",
]

# field_path -> (category, label, value_type)
FIELD_META: dict[str, tuple[str, str, str]] = {
    "remote_access.ssh.enabled": ("SSH", "SSH Enabled", "bool"),
    "remote_access.ssh.version": ("SSH", "SSH Version", "string"),
    "remote_access.telnet.enabled": ("TELNET", "Telnet Enabled", "bool"),
    "remote_access.http.enabled": ("MANAGEMENT_ACCESS", "HTTP Server Enabled", "bool"),
    "remote_access.https.enabled": ("MANAGEMENT_ACCESS", "HTTPS Server Enabled", "bool"),
    "authentication.aaa.enabled": ("AUTHENTICATION", "AAA Enabled", "bool"),
    "authentication.local_users": ("AUTHENTICATION", "Local Users", "string"),
    "authentication.login.lockout": ("AUTHENTICATION", "Login Lockout Policy", "string"),
    "password_security.service_encryption": (
        "PASSWORD_SECURITY", "Password Encryption Service", "bool"),
    "password_security.enable_secret": (
        "PASSWORD_SECURITY", "Enable Secret Configured", "bool"),
    "logging.buffered.enabled": ("LOGGING", "Buffered Logging", "bool"),
    "logging.remote.enabled": ("LOGGING", "Remote Syslog", "bool"),
    "snmp.v3.enabled": ("SNMP", "SNMPv3 Enabled", "bool"),
    "snmp.default_community": ("SNMP", "Default SNMP Community", "bool"),
    "snmp.rw_community": ("SNMP", "Read-Write SNMP Community", "bool"),
    "ntp.configured": ("NTP", "NTP Configured", "bool"),
    "ntp.authenticated": ("NTP", "NTP Authenticated", "bool"),
    "ntp.valid_server": ("NTP", "NTP Server Valid", "bool"),
    "access_control.permit_any": ("ACL_FIREWALL", "Permit-Any Rule Present", "bool"),
    "access_control.default_deny": ("ACL_FIREWALL", "Default Deny Present", "bool"),
    "encryption.weak_ciphers": ("ENCRYPTION", "Weak Ciphers Present", "bool"),
    "management_access.wan_exposed": (
        "MANAGEMENT_ACCESS", "Management Exposed on WAN", "bool"),
    "management_access.insecure_protocols": (
        "MANAGEMENT_ACCESS", "Insecure Mgmt Protocols", "string"),
    "session_management.console.exec_timeout": (
        "SESSION_MANAGEMENT", "Console Exec Timeout", "string"),
    "session_management.vty.exec_timeout": (
        "SESSION_MANAGEMENT", "VTY Exec Timeout", "string"),
    "identity.hostname": ("MANAGEMENT_ACCESS", "Hostname", "string"),
}


def category_for(field_path: str) -> str:
    meta = FIELD_META.get(field_path)
    return meta[0] if meta else "ACCESS_CONTROL"


def label_for(field_path: str) -> str:
    meta = FIELD_META.get(field_path)
    if meta:
        return meta[1]
    return field_path.rsplit(".", 1)[-1].replace("_", " ").title()


def value_type_for(field_path: str) -> str:
    meta = FIELD_META.get(field_path)
    return meta[2] if meta else "string"
