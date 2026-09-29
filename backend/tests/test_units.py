"""Unit tests for the deterministic engines (no HTTP, no DB)."""
from __future__ import annotations

from app.ai.provider import LocalAIProvider
from app.compliance.engine import ComplianceEngine
from app.compliance.evaluator import evaluate_rule
from app.compliance.rule_loader import load_rules
from app.compliance.risk import finding_risk
from app.core.masking import contains_secret_markers, mask_secrets
from app.normalization.normalizer import Normalizer
from app.parsers.registry import get_parser
from app.services.vendor_detection_service import VendorDetectionService
from tests.conftest import fixture_text

RULES = load_rules()


# ── Secret masking ──────────────────────────────────────────────
def test_masking_hides_cisco_secrets():
    raw = "username admin password 7 070C285F4D06\nsnmp-server community public RO"
    masked = mask_secrets(raw)
    assert "070C285F4D06" not in masked
    assert "public" not in masked
    assert "********" in masked
    # Line count preserved so evidence line numbers stay valid.
    assert len(masked.splitlines()) == len(raw.splitlines())


def test_masking_hides_forti_and_junos_secrets():
    forti = 'set password ENC SH2SECRETVALUE'
    junos = 'encrypted-password "$6$SECRET";'
    assert "SH2SECRETVALUE" not in mask_secrets(forti)
    assert "$6$SECRET" not in mask_secrets(junos)


# ── Vendor detection ────────────────────────────────────────────
def test_detect_cisco():
    d = VendorDetectionService().detect(fixture_text("cisco_insecure.cfg"))
    assert d.vendor == "cisco" and d.os == "ios" and d.confidence > 0.4
    assert d.evidence


def test_detect_juniper_and_fortinet():
    assert VendorDetectionService().detect(fixture_text("juniper_insecure.conf")).vendor == "juniper"
    assert VendorDetectionService().detect(fixture_text("fortios_insecure.conf")).vendor == "fortinet"


# ── Parser evidence (Parser Test Principle) ─────────────────────
def test_cisco_parser_ssh_version_evidence():
    parsed = get_parser("cisco").parse(fixture_text("cisco_insecure.cfg"))
    ssh = [f for f in parsed.facts if f.field == "remote_access.ssh.version"]
    assert ssh and ssh[0].value == "1"
    assert ssh[0].evidence.line_start > 0
    assert "ip ssh version 1" in ssh[0].evidence.snippet
    # Unknown pattern captured for training.
    assert any("block-for" in u.snippet for u in parsed.unknown)


def test_juniper_parser_hierarchical():
    parsed = get_parser("juniper").parse(fixture_text("juniper_insecure.conf"))
    fields = {f.field: f.value for f in parsed.facts}
    assert fields.get("remote_access.telnet.enabled") is True
    assert fields.get("remote_access.ssh.version") == "2"
    assert fields.get("access_control.permit_any") is True


def test_fortios_parser_block():
    parsed = get_parser("fortinet").parse(fixture_text("fortios_insecure.conf"))
    fields = {f.field: f.value for f in parsed.facts}
    assert fields.get("remote_access.ssh.version") == "1"
    assert fields.get("management_access.wan_exposed") is True
    assert fields.get("access_control.permit_any") is True


# ── Normalization + evidence ────────────────────────────────────
def test_normalization_builds_model_and_facts():
    parsed = get_parser("cisco").parse(fixture_text("cisco_insecure.cfg"))
    result = Normalizer().normalize(parsed)
    assert result.model["remote_access"]["ssh"]["version"] == "1"
    assert all(f.line_start >= 1 for f in result.facts)
    assert result.unknown  # login block-for


# ── Compliance determinism (Compliance Test Principle) ──────────
def test_compliance_is_deterministic():
    parsed = get_parser("cisco").parse(fixture_text("cisco_insecure.cfg"))
    norm = Normalizer().normalize(parsed)
    r1 = ComplianceEngine().evaluate(norm.model, norm.facts, RULES)
    r2 = ComplianceEngine().evaluate(norm.model, norm.facts, RULES)
    assert r1.overall_score == r2.overall_score
    assert r1.failed == r2.failed and r1.failed >= 8


def test_ssh_version_1_fails_rule():
    ssh_rule = next(r for r in RULES if r.rule_id == "SSH-VERSION-001")
    res = evaluate_rule(ssh_rule, {"remote_access": {"ssh": {"version": "1"}}})
    assert res.result == "FAIL"
    res2 = evaluate_rule(ssh_rule, {"remote_access": {"ssh": {"version": "2"}}})
    assert res2.result == "PASS"


def test_secure_config_scores_higher_than_insecure():
    def score(name: str) -> int:
        p = get_parser("cisco").parse(fixture_text(name))
        n = Normalizer().normalize(p)
        return ComplianceEngine().evaluate(n.model, n.facts, RULES).overall_score
    assert score("cisco_secure.cfg") > score("cisco_insecure.cfg")


# ── Risk (explainable, deterministic) ───────────────────────────
def test_risk_is_deterministic_and_explainable():
    a = finding_risk("CRITICAL", 4)
    b = finding_risk("CRITICAL", 4)
    assert a.score == b.score and a.score > finding_risk("LOW", 1).score
    assert "base(CRITICAL" in a.explanation


# ── AI local provider (suggest only) ────────────────────────────
def test_local_ai_suggests_category_with_confidence():
    provider = LocalAIProvider()
    analysis = provider.analyze_unknown_pattern(
        "login block-for 120 attempts 3 within 60", corpus=[]
    )
    assert 0.0 <= analysis.confidence <= 1.0
    assert analysis.suggested_category  # a category is suggested
    assert analysis.provider == "local"
