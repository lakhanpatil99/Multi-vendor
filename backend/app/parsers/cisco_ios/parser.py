"""Cisco IOS parser — flat / command-oriented configuration.

Produces neutral `ParsedFact`s with line evidence. Line context (line con 0 /
line vty) is tracked so session-timeout facts carry the correct scope.
"""
from __future__ import annotations

import re

from app.parsers.base import BaseParser, ParsedConfiguration

# Security-relevant command prefixes whose UNMAPPED variants should surface as
# unknown patterns for human review (kept narrow to avoid false positives).
_UNKNOWN_PREFIXES = ("login ", "crypto ", "snmp-server host", "ntp access-group")


class CiscoIOSParser(BaseParser):
    vendor = "cisco"
    os = "ios"
    syntax_style = "FLAT"

    def parse(self, raw: str) -> ParsedConfiguration:
        lines = raw.splitlines()
        pc = ParsedConfiguration(vendor=self.vendor, os=self.os, lines=lines)
        consumed: set[int] = set()

        current_line_ctx: str | None = None  # "con" | "vty" | None
        telnet_seen = False
        ssh_seen = False
        http_enabled = None
        https_enabled = None

        def consume(i: int) -> None:
            consumed.add(i)

        for idx, raw_line in enumerate(lines):
            n = idx + 1
            line = raw_line.strip()
            if not line or line.startswith("!"):
                continue
            low = line.lower()

            # ── line context tracking ──
            if low.startswith("line con"):
                current_line_ctx = "con"
                consume(idx)
                continue
            if low.startswith("line vty"):
                current_line_ctx = "vty"
                consume(idx)
                continue
            if low.startswith("line "):
                current_line_ctx = None
                consume(idx)
                continue

            # ── hostname ──
            if low.startswith("hostname "):
                pc.add_fact("identity.hostname", line.split(None, 1)[1], n, line)
                consume(idx)
                continue

            # ── ssh version ──
            m = re.match(r"ip ssh version (\d+)", low)
            if m:
                pc.add_fact("remote_access.ssh.version", m.group(1), n, line)
                ssh_seen = True
                consume(idx)
                continue

            # ── transport input (telnet/ssh on vty) ──
            if low.startswith("transport input"):
                tokens = low.replace("transport input", "").split()
                if "telnet" in tokens or "all" in tokens:
                    telnet_seen = True
                    pc.add_fact("remote_access.telnet.enabled", True, n, line)
                if "ssh" in tokens or "all" in tokens:
                    ssh_seen = True
                consume(idx)
                continue

            # ── http/https server ──
            if low == "ip http server":
                http_enabled = True
                consume(idx)
                continue
            if low == "no ip http server":
                http_enabled = False
                consume(idx)
                continue
            if low == "ip http secure-server":
                https_enabled = True
                consume(idx)
                continue

            # ── aaa ──
            if low == "aaa new-model":
                pc.add_fact("authentication.aaa.enabled", True, n, line)
                consume(idx)
                continue
            if low == "no aaa new-model":
                pc.add_fact("authentication.aaa.enabled", False, n, line)
                consume(idx)
                continue

            # ── password encryption service ──
            if low == "service password-encryption":
                pc.add_fact("password_security.service_encryption", True, n, line)
                consume(idx)
                continue
            if low == "no service password-encryption":
                pc.add_fact("password_security.service_encryption", False, n, line)
                consume(idx)
                continue

            # ── enable secret ──
            if low.startswith("enable secret"):
                pc.add_fact("password_security.enable_secret", True, n, line)
                consume(idx)
                continue

            # ── local users ──
            if low.startswith("username "):
                user = line.split()[1]
                pc.add_fact("authentication.local_users", user, n, line)
                consume(idx)
                continue

            # ── logging ──
            if low == "no logging buffered":
                pc.add_fact("logging.buffered.enabled", False, n, line)
                consume(idx)
                continue
            if low.startswith("logging buffered"):
                pc.add_fact("logging.buffered.enabled", True, n, line)
                consume(idx)
                continue
            if low.startswith("logging host") or re.match(r"logging \d+\.\d+\.\d+\.\d+", low):
                pc.add_fact("logging.remote.enabled", True, n, line)
                consume(idx)
                continue

            # ── snmp ──
            if low.startswith("snmp-server community"):
                parts = line.split()
                community = parts[2] if len(parts) > 2 else ""
                access = parts[3].upper() if len(parts) > 3 else "RO"
                if community.lower() in {"public", "private"}:
                    pc.add_fact("snmp.default_community", True, n, line)
                if access == "RW":
                    pc.add_fact("snmp.rw_community", True, n, line)
                consume(idx)
                continue
            if low.startswith("snmp-server group") and "v3" in low:
                pc.add_fact("snmp.v3.enabled", True, n, line)
                consume(idx)
                continue

            # ── ntp ──
            m = re.match(r"ntp server (\S+)", low)
            if m:
                server = m.group(1)
                pc.add_fact("ntp.configured", True, n, line)
                pc.add_fact("ntp.valid_server", server not in {"0.0.0.0", "255.255.255.255"}, n, line)
                consume(idx)
                continue
            if low == "ntp authenticate":
                pc.add_fact("ntp.authenticated", True, n, line)
                consume(idx)
                continue

            # ── access lists ──
            if low.startswith("access-list"):
                if re.search(r"permit\s+(ip\s+)?any(\s+any)?$", low) or low.endswith("permit any"):
                    pc.add_fact("access_control.permit_any", True, n, line)
                if "deny any" in low:
                    pc.add_fact("access_control.default_deny", True, n, line)
                consume(idx)
                continue

            # ── exec-timeout (scoped to current line context) ──
            if low.startswith("exec-timeout"):
                value = line.split(None, 1)[1] if len(line.split()) > 1 else ""
                if current_line_ctx == "con":
                    pc.add_fact("session_management.console.exec_timeout", value, n, line)
                elif current_line_ctx == "vty":
                    pc.add_fact("session_management.vty.exec_timeout", value, n, line)
                consume(idx)
                continue

            # ── unknown security-relevant lines ──
            if any(low.startswith(p) for p in _UNKNOWN_PREFIXES):
                pc.add_unknown(line, n, hint="Unrecognized Cisco IOS security directive")

        # Derived facts from accumulated context.
        _first = _first_line(lines, "ip ssh version") or _first_line(lines, "transport input")
        if ssh_seen:
            pc.add_fact("remote_access.ssh.enabled", True, _first or 1,
                        "ip ssh / transport input ssh")
        if not telnet_seen:
            # Absence of telnet transport is a positive (telnet disabled).
            pc.add_fact("remote_access.telnet.enabled", False, 1,
                        "(no telnet transport configured)")
        if http_enabled is not None:
            ln = _first_line(lines, "http server") or 1
            pc.add_fact("remote_access.http.enabled", http_enabled, ln, "ip http server")
        if https_enabled is not None:
            ln = _first_line(lines, "secure-server") or 1
            pc.add_fact("remote_access.https.enabled", https_enabled, ln, "ip http secure-server")

        return pc


def _first_line(lines: list[str], needle: str) -> int | None:
    for idx, line in enumerate(lines):
        if needle in line.lower():
            return idx + 1
    return None
