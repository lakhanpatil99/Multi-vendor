"""Vendor-aware remediation templates keyed by (remediation_intent, vendor).

Templates describe simulated commands only. NOTHING is ever executed.
Missing (intent, vendor) combinations fall back to a safe generic template.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class RemediationTemplate:
    expected_config: str
    commands: list[str] = field(default_factory=list)
    verification: list[str] = field(default_factory=list)
    rollback: list[str] = field(default_factory=list)
    disruptive: bool = False


# intent -> vendor -> template
TEMPLATES: dict[str, dict[str, RemediationTemplate]] = {
    "disable_telnet": {
        "cisco": RemediationTemplate(
            expected_config="line vty 0 4\n transport input ssh",
            commands=["configure terminal", "line vty 0 4", " transport input ssh",
                      "line vty 5 15", " transport input ssh", "end", "write memory"],
            verification=["show run | include transport input",
                          "Attempt Telnet — must be refused."],
            rollback=["configure terminal", "line vty 0 4",
                      " transport input telnet ssh", "end"],
            disruptive=True,
        ),
        "juniper": RemediationTemplate(
            expected_config="delete system services telnet",
            commands=["configure", "delete system services telnet", "commit and-quit"],
            verification=["show configuration system services  (no telnet)"],
            rollback=["configure", "set system services telnet", "commit"],
            disruptive=True,
        ),
        "fortinet": RemediationTemplate(
            expected_config='edit "wan1"\n    set allowaccess ping https',
            commands=["config system interface", '    edit "wan1"',
                      "        set allowaccess ping https", "    next", "end"],
            verification=["show system interface wan1  (no telnet)"],
            rollback=["config system interface", '    edit "wan1"',
                      "        set allowaccess ping https ssh telnet", "    next", "end"],
            disruptive=True,
        ),
    },
    "ssh_v2": {
        "cisco": RemediationTemplate(
            expected_config="ip ssh version 2",
            commands=["configure terminal", "ip ssh version 2", "end", "write memory"],
            verification=["show ip ssh  (expect version 2.0)"],
            rollback=["configure terminal", "ip ssh version 1", "end"],
        ),
        "fortinet": RemediationTemplate(
            expected_config="config system global\n    set admin-ssh-v1 disable",
            commands=["config system global", "    set admin-ssh-v1 disable", "end"],
            verification=["get system global | grep ssh-v1"],
            rollback=["config system global", "    set admin-ssh-v1 enable", "end"],
        ),
    },
    "snmp_v3": {
        "cisco": RemediationTemplate(
            expected_config="snmp-server group READONLY v3 priv",
            commands=["configure terminal", "no snmp-server community public",
                      "no snmp-server community private",
                      "snmp-server group READONLY v3 priv",
                      "snmp-server user monitor READONLY v3 auth sha <AUTH_KEY> priv aes 128 <PRIV_KEY>",
                      "end", "write memory"],
            verification=["show snmp community  (expect none)", "show snmp user"],
            rollback=["Restore prior SNMP config from backup snapshot."],
            disruptive=True,
        ),
    },
    "enable_logging": {
        "cisco": RemediationTemplate(
            expected_config="logging buffered 32768 informational\nlogging host 10.20.9.5",
            commands=["configure terminal", "service timestamps log datetime msec",
                      "logging buffered 32768 informational", "logging host 10.20.9.5",
                      "end", "write memory"],
            verification=["show logging  (buffer + host active)"],
            rollback=["configure terminal", "no logging host 10.20.9.5", "end"],
        ),
    },
    "configure_ntp": {
        "cisco": RemediationTemplate(
            expected_config="ntp authenticate\nntp server 192.0.2.10 key 1",
            commands=["configure terminal", "no ntp server 0.0.0.0", "ntp authenticate",
                      "ntp authentication-key 1 md5 <KEY>", "ntp trusted-key 1",
                      "ntp server 192.0.2.10 key 1", "end", "write memory"],
            verification=["show ntp associations  (synced)"],
            rollback=["configure terminal", "no ntp server 192.0.2.10", "end"],
        ),
    },
    "enable_aaa": {
        "cisco": RemediationTemplate(
            expected_config="aaa new-model\naaa authentication login default group tacacs+ local",
            commands=["configure terminal", "aaa new-model", "tacacs server TAC1",
                      " address ipv4 10.20.9.10", " key <KEY>",
                      "aaa authentication login default group tacacs+ local",
                      "aaa authorization exec default group tacacs+ local", "end", "write memory"],
            verification=["show run | include aaa"],
            rollback=["configure terminal", "no aaa new-model", "end"],
            disruptive=True,
        ),
    },
    "password_encryption": {
        "cisco": RemediationTemplate(
            expected_config="service password-encryption",
            commands=["configure terminal", "service password-encryption", "end", "write memory"],
            verification=["show run | include service password"],
            rollback=["configure terminal", "no service password-encryption", "end"],
        ),
    },
    "restrict_acl": {
        "cisco": RemediationTemplate(
            expected_config="access-list 10 permit 10.20.9.0 0.0.0.255\naccess-list 10 deny any log",
            commands=["configure terminal", "no access-list 10",
                      "access-list 10 permit 10.20.9.0 0.0.0.255",
                      "access-list 10 deny any log", "end", "write memory"],
            verification=["show access-lists 10"],
            rollback=["Restore ACL 10 from backup snapshot."],
            disruptive=True,
        ),
        "juniper": RemediationTemplate(
            expected_config="least-privilege application-aware policies + default deny",
            commands=["configure",
                      "delete security policies from-zone trust to-zone untrust policy allow-all",
                      "set security policies from-zone trust to-zone untrust policy web-out match application junos-https",
                      "set security policies from-zone trust to-zone untrust policy web-out then permit",
                      "commit and-quit"],
            verification=["show security policies  (no permit-any)"],
            rollback=["Restore from committed rollback (rollback 1)."],
            disruptive=True,
        ),
        "fortinet": RemediationTemplate(
            expected_config="scoped src/dst addresses + specific services",
            commands=["config firewall policy", "    edit 1",
                      '        set srcaddr "corp-net"', '        set dstaddr "web-servers"',
                      '        set service "HTTPS"', "    next", "end"],
            verification=["show firewall policy 1"],
            rollback=["Restore prior policy from backup."],
            disruptive=True,
        ),
    },
    "restrict_mgmt": {
        "fortinet": RemediationTemplate(
            expected_config='edit "wan1"\n    set allowaccess ping https',
            commands=["config system interface", '    edit "wan1"',
                      "        set allowaccess ping https", "    next", "end"],
            verification=["show system interface wan1  (restricted)"],
            rollback=["config system interface", '    edit "wan1"',
                      "        set allowaccess ping https ssh telnet http", "    next", "end"],
            disruptive=True,
        ),
    },
    "session_timeout": {
        "cisco": RemediationTemplate(
            expected_config="line con 0\n exec-timeout 5 0",
            commands=["configure terminal", "line con 0", " exec-timeout 5 0", "end", "write memory"],
            verification=["Confirm console times out after 5 minutes idle."],
            rollback=["configure terminal", "line con 0", " exec-timeout 0 0", "end"],
        ),
    },
}


def get_template(intent: str, vendor: str) -> RemediationTemplate:
    by_vendor = TEMPLATES.get(intent, {})
    if vendor in by_vendor:
        return by_vendor[vendor]
    # Safe generic fallback — never executed.
    return RemediationTemplate(
        expected_config="(vendor-specific remediation not yet templated)",
        commands=[f"# Manual remediation required for intent '{intent}' on {vendor}"],
        verification=["Manually verify the control is satisfied."],
        rollback=["Restore previous configuration from backup."],
        disruptive=False,
    )
