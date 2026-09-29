"""API + end-to-end pipeline tests (HTTP via TestClient, offline SQLite)."""
from __future__ import annotations

from tests.conftest import fixture_text


def _upload(client, headers, name="cisco_insecure.cfg", vendor_file="cisco_insecure.cfg"):
    files = {"file": (name, fixture_text(vendor_file), "text/plain")}
    r = client.post("/api/v1/configurations/upload", files=files, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()["data"]


def _analyze(client, headers, config_id):
    r = client.post(f"/api/v1/configurations/{config_id}/analyze", headers=headers)
    assert r.status_code == 200, r.text
    return r.json()["data"]


# ── Health / auth ───────────────────────────────────────────────
def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200 and r.json()["data"]["status"] == "ok"


def test_ready(client):
    r = client.get("/api/v1/health/ready")
    assert r.json()["data"]["checks"]["database"] == "ok"


def test_auth_required(client):
    assert client.get("/api/v1/devices").status_code == 401


def test_auth_me(client, auth_headers):
    r = client.get("/api/v1/auth/me", headers=auth_headers)
    assert r.status_code == 200 and r.json()["data"]["role"] == "ADMIN"


# ── RBAC ────────────────────────────────────────────────────────
def test_viewer_cannot_create_device(client, viewer_headers):
    r = client.post("/api/v1/devices", json={"hostname": "x", "vendor": "cisco"},
                    headers=viewer_headers)
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "authorization_error"


# ── Device CRUD + pagination ────────────────────────────────────
def test_device_crud_and_pagination(client, auth_headers):
    created = client.post("/api/v1/devices",
                          json={"hostname": "SW-1", "vendor": "cisco", "device_type": "SWITCH"},
                          headers=auth_headers).json()["data"]
    did = created["id"]
    assert client.get(f"/api/v1/devices/{did}", headers=auth_headers).status_code == 200
    upd = client.patch(f"/api/v1/devices/{did}", json={"location": "DC-East"},
                       headers=auth_headers).json()["data"]
    assert upd["location"] == "DC-East"
    lst = client.get("/api/v1/devices?page=1&page_size=1", headers=auth_headers).json()
    assert lst["meta"]["page_size"] == 1 and lst["meta"]["total"] >= 1
    assert client.delete(f"/api/v1/devices/{did}", headers=auth_headers).status_code == 200


# ── Tenant isolation ────────────────────────────────────────────
def test_tenant_isolation(client, auth_headers, other_org_headers):
    created = client.post("/api/v1/devices", json={"hostname": "SECRET-DEV", "vendor": "cisco"},
                          headers=auth_headers).json()["data"]
    # Another org must not see it.
    r = client.get(f"/api/v1/devices/{created['id']}", headers=other_org_headers)
    assert r.status_code == 404


# ── Upload validation + masking ─────────────────────────────────
def test_upload_rejects_bad_extension(client, auth_headers):
    files = {"file": ("evil.exe", b"binary", "application/octet-stream")}
    r = client.post("/api/v1/configurations/upload", files=files, headers=auth_headers)
    assert r.status_code == 422 and r.json()["error"]["code"] == "validation_error"


def test_upload_masks_secrets(client, auth_headers):
    cfg = _upload(client, auth_headers)
    detail = client.get(f"/api/v1/configurations/{cfg['id']}", headers=auth_headers).json()["data"]
    assert cfg["detected_vendor"] == "cisco"
    assert "070C285F4D06" not in detail["sanitized_content"]
    assert "********" in detail["sanitized_content"]


# ── End-to-end pipeline (insecure Cisco) ────────────────────────
def test_end_to_end_cisco_pipeline(client, auth_headers):
    cfg = _upload(client, auth_headers)
    job = _analyze(client, auth_headers, cfg["id"])
    # POST returns {job_id, status}; the result summary lives on the job record.
    assert job["status"] == "COMPLETED"

    # Job queryable with full result
    jr = client.get(f"/api/v1/analysis/{job['job_id']}", headers=auth_headers).json()["data"]
    assert jr["status"] == "COMPLETED" and jr["progress"] == 100
    assert jr["result"]["findings_created"] >= 8
    assert jr["result"]["unknown_patterns"] >= 1

    # Normalized model + evidence
    norm = client.get(f"/api/v1/normalization/{cfg['id']}", headers=auth_headers).json()["data"]
    assert norm["model"]["remote_access"]["ssh"]["version"] == "1"
    assert any(f["line_start"] for f in norm["facts"])

    # Findings with framework mappings + evidence
    findings = client.get(f"/api/v1/findings?device_id={cfg['device_id']}",
                          headers=auth_headers).json()
    assert findings["meta"]["total"] >= 8
    one = findings["data"][0]
    assert one["frameworks"] and one["evidence"]
    assert {"CIS", "NIST", "STIG", "ISO"} & {m["framework"] for m in one["frameworks"]}

    # Filter by severity
    crit = client.get("/api/v1/findings?severity=CRITICAL", headers=auth_headers).json()
    assert all(f["severity"] == "CRITICAL" for f in crit["data"])

    # Finding lifecycle
    fid = one["id"]
    patched = client.patch(f"/api/v1/findings/{fid}", json={"status": "ACKNOWLEDGED"},
                           headers=auth_headers).json()["data"]
    assert patched["status"] == "ACKNOWLEDGED"

    # Remediation generated (never executed)
    rems = client.get(f"/api/v1/remediation?device_id={cfg['device_id']}",
                      headers=auth_headers).json()
    assert rems["meta"]["total"] >= 1
    rem = rems["data"][0]
    assert rem["commands"] and rem["status"] == "GENERATED"
    decided = client.post(f"/api/v1/remediation/{rem['id']}/decision",
                          json={"decision": "APPROVED"}, headers=auth_headers).json()["data"]
    assert decided["approval"] == "APPROVED"

    # Compliance overview
    ov = client.get("/api/v1/compliance", headers=auth_headers).json()["data"]
    assert 0 <= ov["overall_score"] <= 100 and ov["frameworks"]

    # Audit trail records the pipeline
    audit = client.get("/api/v1/audit", headers=auth_headers).json()
    types = {a["event_type"] for a in audit["data"]}
    assert "CONFIGURATION_UPLOADED" in types
    assert "COMPLIANCE_SCAN_COMPLETED" in types


# ── Frameworks ──────────────────────────────────────────────────
def test_frameworks(client, auth_headers):
    fw = client.get("/api/v1/frameworks", headers=auth_headers).json()["data"]
    assert {f["key"] for f in fw} == {"CIS", "NIST", "STIG", "ISO"}
    cis = client.get("/api/v1/frameworks/CIS", headers=auth_headers).json()["data"]
    assert cis["framework"]["key"] == "CIS" and cis["controls"]


# ── Human-in-the-loop training ──────────────────────────────────
def test_training_approval_flow(client, auth_headers):
    cfg = _upload(client, auth_headers)
    _analyze(client, auth_headers, cfg["id"])
    pending = client.get("/api/v1/training/patterns?status=PENDING", headers=auth_headers).json()
    assert pending["meta"]["total"] >= 1
    pid = pending["data"][0]["id"]
    approved = client.post(f"/api/v1/training/patterns/{pid}/approve",
                           json={"decision": "APPROVE", "category": "AUTHENTICATION",
                                 "field": "authentication.login.lockout"},
                           headers=auth_headers).json()["data"]
    assert approved["status"] == "APPROVED"


# ── Reports ─────────────────────────────────────────────────────
def test_report_generation(client, auth_headers):
    cfg = _upload(client, auth_headers)
    _analyze(client, auth_headers, cfg["id"])
    created = client.post("/api/v1/reports",
                          json={"title": "Device Report", "category": "DEVICE",
                                "fmt": "PDF", "device_ids": [cfg["device_id"]]},
                          headers=auth_headers).json()["data"]
    assert created["status"] == "READY"
    got = client.get(f"/api/v1/reports/{created['id']}", headers=auth_headers).json()["data"]
    assert got["preview"]["compliance_score"] is not None
    assert got["findings_count"] >= 1


# ── Error envelope ──────────────────────────────────────────────
def test_not_found_envelope(client, auth_headers):
    r = client.get("/api/v1/devices/does-not-exist", headers=auth_headers)
    assert r.status_code == 404
    body = r.json()
    assert body["error"]["code"] == "not_found" and "message" in body["error"]
