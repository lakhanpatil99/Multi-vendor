"""Parser registry — maps a detected vendor to its parser.

Extensible: register a new vendor's parser here (and a detector signal) to add
support without touching normalization or the compliance engine.
"""
from __future__ import annotations

from app.core.exceptions import ParsingError
from app.parsers.base import BaseParser
from app.parsers.cisco_ios import CiscoIOSParser
from app.parsers.fortios import FortiOSParser
from app.parsers.juniper_junos import JuniperJunosParser

_REGISTRY: dict[str, type[BaseParser]] = {
    "cisco": CiscoIOSParser,
    "juniper": JuniperJunosParser,
    "fortinet": FortiOSParser,
}


def get_parser(vendor: str) -> BaseParser:
    cls = _REGISTRY.get(vendor.lower())
    if not cls:
        raise ParsingError(f"No parser registered for vendor '{vendor}'")
    return cls()


def supported_vendors() -> list[str]:
    return sorted(_REGISTRY)
