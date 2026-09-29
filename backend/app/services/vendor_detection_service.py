"""Vendor + OS detection from raw configuration text.

Multi-signal, weighted scoring (never a single keyword). Produces a vendor, an
OS, a confidence in [0,1], and the evidence lines that drove the decision.
"""
from __future__ import annotations

from dataclasses import dataclass

# (regex-ish substring, weight) signals per vendor. Case-insensitive contains.
_SIGNALS: dict[str, list[tuple[str, float]]] = {
    "cisco": [
        ("version 1", 0.15),
        ("service timestamps", 0.2),
        ("ip ssh version", 0.2),
        ("interface gigabitethernet", 0.2),
        ("line vty", 0.2),
        ("snmp-server community", 0.15),
        ("enable secret", 0.15),
        ("transport input", 0.15),
    ],
    "juniper": [
        ("system {", 0.25),
        ("host-name", 0.15),
        ("## last commit", 0.2),
        ("protocol-version", 0.2),
        ("from-zone", 0.2),
        ("security {", 0.2),
        ("set system services", 0.25),
    ],
    "fortinet": [
        ("config system global", 0.3),
        ("config-version=", 0.3),
        ("set hostname", 0.15),
        ("config firewall policy", 0.25),
        ("edit ", 0.1),
        ("next\nend", 0.1),
        ("config system interface", 0.2),
    ],
}

_OS_BY_VENDOR = {"cisco": "ios", "juniper": "junos", "fortinet": "fortios"}


@dataclass
class DetectionResult:
    vendor: str
    os: str
    confidence: float
    evidence: list[str]


class VendorDetectionService:
    def detect(self, raw: str) -> DetectionResult:
        text = raw.lower()
        best_vendor = "unknown"
        best_score = 0.0
        best_evidence: list[str] = []

        for vendor, signals in _SIGNALS.items():
            score = 0.0
            evidence: list[str] = []
            for needle, weight in signals:
                if needle in text:
                    score += weight
                    evidence.append(needle)
            if score > best_score:
                best_score = score
                best_vendor = vendor
                best_evidence = evidence

        # FortiGate config-version marker is decisive; boost confidence.
        confidence = min(1.0, round(best_score, 2))
        if best_vendor == "unknown":
            confidence = 0.0
        os = _OS_BY_VENDOR.get(best_vendor, "unknown")
        return DetectionResult(best_vendor, os, confidence, best_evidence)
