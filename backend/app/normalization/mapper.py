"""Helpers to assemble the nested neutral model from flat field paths."""
from __future__ import annotations

from typing import Any

# Fields that legitimately hold multiple values (accumulate into a list).
MULTI_VALUE_FIELDS = {
    "authentication.local_users",
    "management_access.insecure_protocols",
}


def set_nested(model: dict[str, Any], dotted: str, value: Any) -> None:
    """Set model["a"]["b"]["c"] = value from dotted path 'a.b.c'.

    Scalar fields are last-write-wins. Only fields declared multi-valued
    accumulate into a list (e.g. local users), so a boolean emitted twice is
    never accidentally turned into a list.
    """
    parts = dotted.split(".")
    node = model
    for part in parts[:-1]:
        nxt = node.get(part)
        if not isinstance(nxt, dict):
            nxt = {}
            node[part] = nxt
        node = nxt
    leaf = parts[-1]

    if dotted in MULTI_VALUE_FIELDS:
        existing = node.get(leaf)
        if existing is None:
            node[leaf] = [value]
        elif isinstance(existing, list):
            if value not in existing:
                existing.append(value)
        else:
            node[leaf] = [existing, value]
    else:
        node[leaf] = value
