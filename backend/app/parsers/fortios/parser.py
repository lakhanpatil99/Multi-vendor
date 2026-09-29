"""FortiOS parser — block-based (config / edit / set / next / end).

Tracks the config-section stack and the current `edit` object so that
`set allowaccess ...` etc. are attributed to the correct interface/object.
"""
from __future__ import annotations

import re

from app.parsers.base import BaseParser, ParsedConfiguration


class FortiOSParser(BaseParser):
    vendor = "fortinet"
    os = "fortios"
    syntax_style = "BLOCK"

    def parse(self, raw: str) -> ParsedConfiguration:
        lines = raw.splitlines()
        pc = ParsedConfiguration(vendor=self.vendor, os=self.os, lines=lines)

        section: list[str] = []          # e.g. ["system", "interface"]
        edit_name: str | None = None
        telnet_seen = False
        ssh_seen = False
        # firewall policy aggregation
        pol_src_all = pol_dst_all = pol_accept = False
        pol_line = 1

        for idx, raw_line in enumerate(lines):
            n = idx + 1
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            low = line.lower()

            if low.startswith("config "):
                section = low[len("config "):].split()
                edit_name = None
                if section[:2] == ["system", "fortiguard"]:
                    pc.add_unknown(line, n, hint="FortiOS FortiGuard channel block")
                continue
            if low == "end":
                section = []
                edit_name = None
                continue
            if low.startswith("edit "):
                edit_name = line.split(None, 1)[1].strip().strip('"')
                continue
            if low == "next":
                # finalize per-object aggregation for firewall policy
                if section[:2] == ["firewall", "policy"] and pol_src_all and pol_dst_all and pol_accept:
                    pc.add_fact("access_control.permit_any", True, pol_line,
                                "firewall policy any/any accept")
                    pol_src_all = pol_dst_all = pol_accept = False
                edit_name = None
                continue

            if not low.startswith("set "):
                continue
            body = line[len("set "):].strip()
            key = body.split(None, 1)[0] if body else ""
            val = body[len(key):].strip().strip('"') if body else ""
            sec = section[:2]

            # ── system global ──
            if sec == ["system", "global"]:
                if key == "hostname":
                    pc.add_fact("identity.hostname", val, n, line)
                elif key == "admin-ssh-v1":
                    ssh_seen = True
                    if val.lower() == "enable":
                        pc.add_fact("remote_access.ssh.version", "1", n, line)
                elif key == "admintimeout":
                    pc.add_fact("session_management.vty.exec_timeout", val, n, line)
                elif key == "gui-certificate":
                    pc.add_unknown(line, n, hint="FortiOS GUI TLS certificate assignment")
                continue

            # ── interfaces: allowaccess ──
            if sec == ["system", "interface"] and key == "allowaccess":
                protos = val.lower().split()
                if "ssh" in protos:
                    ssh_seen = True
                if "telnet" in protos:
                    telnet_seen = True
                insecure = [p for p in protos if p in {"telnet", "http"}]
                is_wan = bool(edit_name and "wan" in edit_name.lower())
                if insecure:
                    pc.add_fact("management_access.insecure_protocols",
                                ",".join(insecure), n, line)
                    if is_wan:
                        pc.add_fact("management_access.wan_exposed", True, n, line)
                continue

            # ── snmp community ──
            if sec == ["system", "snmp"] and key == "name":
                if val.lower() in {"public", "private"}:
                    pc.add_fact("snmp.default_community", True, n, line)
                continue

            # ── ntp ──
            if sec == ["system", "ntp"] and key == "ntpsync":
                enabled = val.lower() == "enable"
                pc.add_fact("ntp.configured", enabled, n, line)
                continue

            # ── firewall policy aggregation ──
            if sec == ["firewall", "policy"]:
                if key == "srcaddr" and val.lower() == "all":
                    pol_src_all = True
                    pol_line = n
                elif key == "dstaddr" and val.lower() == "all":
                    pol_dst_all = True
                elif key == "action" and val.lower() == "accept":
                    pol_accept = True
                continue

        if ssh_seen:
            pc.add_fact("remote_access.ssh.enabled", True, 1, "admin ssh access")
        pc.add_fact("remote_access.telnet.enabled", telnet_seen, 1,
                    "telnet in allowaccess" if telnet_seen else "(no telnet allowaccess)")
        return pc
