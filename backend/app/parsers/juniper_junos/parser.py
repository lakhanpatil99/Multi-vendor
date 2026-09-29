"""Juniper Junos parser — hierarchical (brace-stanza) configuration.

The native hierarchy is flattened into token paths (path + leaf) with line
evidence, then mapped to neutral facts. Junos is parsed on its own terms; it is
never coerced into Cisco syntax.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.parsers.base import BaseParser, ParsedConfiguration


@dataclass
class _Leaf:
    tokens: list[str]
    line: int
    snippet: str


class JuniperJunosParser(BaseParser):
    vendor = "juniper"
    os = "junos"
    syntax_style = "HIERARCHICAL"

    def parse(self, raw: str) -> ParsedConfiguration:
        lines = raw.splitlines()
        pc = ParsedConfiguration(vendor=self.vendor, os=self.os, lines=lines)
        leaves = self._flatten(lines)

        ssh_block = False
        telnet_seen = False
        has_permit = has_any_src = has_any_dst = False
        permit_line = 1

        for leaf in leaves:
            t = leaf.tokens
            joined = " ".join(t)

            if t[:3] == ["system", "host-name"] and len(t) >= 3:
                pc.add_fact("identity.hostname", t[2].rstrip(";"), leaf.line, leaf.snippet)
            elif t[:3] == ["system", "services", "ssh"]:
                ssh_block = True
                if len(t) >= 5 and t[3] == "protocol-version":
                    version = t[4].lstrip("v")
                    pc.add_fact("remote_access.ssh.version", version, leaf.line, leaf.snippet)
                elif len(t) == 3:
                    pass  # bare ssh block open
                elif t[3] not in {"root-login"}:
                    # Unrecognized ssh sub-directive → training candidate.
                    pc.add_unknown(leaf.snippet, leaf.line,
                                   hint="Unrecognized Junos SSH directive")
            elif t[:3] == ["system", "services", "telnet"]:
                telnet_seen = True
                pc.add_fact("remote_access.telnet.enabled", True, leaf.line, leaf.snippet)
            elif t[:4] == ["system", "services", "web-management", "http"]:
                pc.add_fact("remote_access.http.enabled", True, leaf.line, leaf.snippet)
            elif t[:4] == ["system", "services", "web-management", "https"]:
                pc.add_fact("remote_access.https.enabled", True, leaf.line, leaf.snippet)
            elif t[:3] == ["system", "login", "user"] and len(t) >= 4:
                pc.add_fact("authentication.local_users", t[3], leaf.line, leaf.snippet)
            elif t[:3] == ["system", "login", "retry-options"]:
                pc.add_unknown(leaf.snippet, leaf.line,
                               hint="Junos login retry/lockout policy")
            elif t[:2] == ["snmp", "community"] and len(t) >= 3:
                name = t[2]
                if name.lower() in {"public", "private"}:
                    pc.add_fact("snmp.default_community", True, leaf.line, leaf.snippet)
                if "read-write" in joined:
                    pc.add_fact("snmp.rw_community", True, leaf.line, leaf.snippet)
            elif t[:3] == ["system", "ntp", "server"] and len(t) >= 4:
                server = t[3].rstrip(";")
                pc.add_fact("ntp.configured", True, leaf.line, leaf.snippet)
                pc.add_fact("ntp.valid_server", server not in {"0.0.0.0"}, leaf.line, leaf.snippet)
            elif t[:2] == ["system", "ntp"] and "authentication-key" in joined:
                pc.add_fact("ntp.authenticated", True, leaf.line, leaf.snippet)

            # Security policy aggregation
            if "source-address" in t and "any" in t:
                has_any_src = True
            if "destination-address" in t and "any" in t:
                has_any_dst = True
            if t[-2:] == ["then", "permit"] or t[-1:] == ["permit"]:
                if "security" in t or "policy" in joined or "policies" in joined:
                    has_permit = True
                    permit_line = leaf.line

        if ssh_block:
            pc.add_fact("remote_access.ssh.enabled", True, 1, "system services ssh")
        if not telnet_seen:
            pc.add_fact("remote_access.telnet.enabled", False, 1,
                        "(no telnet service configured)")
        if has_permit and has_any_src and has_any_dst:
            pc.add_fact("access_control.permit_any", True, permit_line,
                        "policy permit any/any")

        return pc

    # ── hierarchy flattening ─────────────────────────────────────
    def _flatten(self, lines: list[str]) -> list[_Leaf]:
        leaves: list[_Leaf] = []
        stack: list[str] = []
        for idx, raw_line in enumerate(lines):
            n = idx + 1
            line = raw_line.strip()
            if not line or line.startswith("#") or line.startswith("/*"):
                continue
            # Strip inline annotations (## SECRET-DATA etc.)
            line = line.split("##")[0].strip()
            if not line:
                continue

            if line == "}":
                if stack:
                    stack.pop()
                continue
            if line.endswith("{"):
                name = line[:-1].strip()
                stack.append(name)
                # A block open can itself be a leaf signal (e.g. ssh block).
                tokens = " ".join(stack).split()
                leaves.append(_Leaf(tokens, n, name))
                continue
            if line.endswith(";"):
                stmt = line[:-1].strip()
                tokens = (" ".join(stack) + " " + stmt).split()
                leaves.append(_Leaf(tokens, n, line))
                continue
        return leaves
