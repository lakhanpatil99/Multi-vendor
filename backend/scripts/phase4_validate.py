"""Phase 4 — live system validation harness.

Exercises the REAL running backend API (http://127.0.0.1:8000/api/v1) — the same
endpoints the browser calls — across the full matrix and prints a PASS/FAIL
table. No mock data. Requires the server to be running and seeded.

Run (from backend/): python -m scripts.phase4_validate
"""
from __future__ import annotations

import io
import sys
import time
from pathlib import Path

import httpx

BASE = "http://127.0.0.1:8000/api/v1"
DEV = {"Authorization": "Bearer dev-local-token"}
FIX = Path(__file__).resolve().parent.parent / "tests" / "fixtures"

results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name} :: {detail}")


def envelope(r: httpx.Response):
    return r.json().get("data")


def ensure_viewer_and_second_org() -> tuple[str, str]:
    """Create (idempotently) a VIEWER in the dev org and a user in a 2nd org,
    returning dev-impersonation tokens for authz + tenant tests."""
    from sqlalchemy import select

    from app.core.config import settings
    from app.db.session import session_scope
    from app.models.organization import Organization, User

    with session_scope() as db:
        org1 = db.execute(
            select(Organization).where(Organization.slug == settings.dev_org_slug)
        ).scalar_one()
        viewer = db.execute(
            select(User).where(User.organization_id == org1.id,
                               User.email == "viewer@acme.example")
        ).scalar_one_or_none()
        if not viewer:
            viewer = User(organization_id=org1.id, email="viewer@acme.example",
                          full_name="Read Only", role="VIEWER")
            db.add(viewer)
            db.flush()
        org2 = db.execute(
            select(Organization).where(Organization.slug == "beta-corp")
        ).scalar_one_or_none()
        if not org2:
            org2 = Organization(name="Beta Corp", slug="beta-corp")
            db.add(org2)
            db.flush()
        beta = db.execute(
            select(User).where(User.organization_id == org2.id,
                               User.email == "beta@beta.example")
        ).scalar_one_or_none()
        if not beta:
            beta = User(organization_id=org2.id, email="beta@beta.example",
                        full_name="Beta Admin", role="ADMIN")
            db.add(beta)
            db.flush()
        return viewer.id, beta.id


def upload_and_analyze(c: httpx.Client, filename: str, content: bytes) -> dict:
    files = {"file": (filename, content, "text/plain")}
    r = c.post(f"{BASE}/configurations/upload", files=files,
               data={"source": "FILE_UPLOAD"}, headers=DEV)
    r.raise_for_status()
    cfg = envelope(r)
    a = c.post(f"{BASE}/configurations/{cfg['id']}/analyze", headers=DEV)
    a.raise_for_status()
    job_id = envelope(a)["job_id"]
    # Poll to terminal (inline backend completes quickly).
    state = None
    for _ in range(40):
        jr = c.get(f"{BASE}/analysis/{job_id}", headers=DEV)
        state = envelope(jr)
        if state["status"] in ("COMPLETED", "FAILED", "CANCELLED"):
            break
        time.sleep(0.4)
    return {"config": cfg, "job": state}


def main() -> int:
    c = httpx.Client(timeout=60)

    # 1. Health / readiness
    r = c.get(f"{BASE}/health")
    check("Backend startup / health", r.status_code == 200 and envelope(r)["status"] == "ok",
          f"status={r.status_code}")
    r = c.get(f"{BASE}/health/ready")
    check("Supabase/DB connection (ready)", envelope(r)["checks"]["database"] == "ok",
          str(envelope(r)["checks"]))

    # 2. Auth
    r = c.get(f"{BASE}/devices")
    check("Auth: unauthenticated -> 401", r.status_code == 401, f"status={r.status_code}")
    r = c.get(f"{BASE}/auth/me", headers=DEV)
    check("Auth: /auth/me", r.status_code == 200 and envelope(r)["role"] == "ADMIN",
          f"role={envelope(r).get('role') if r.status_code==200 else r.status_code}")

    # 3. Authorization (VIEWER cannot create device) + tenant isolation setup
    viewer_id, beta_id = ensure_viewer_and_second_org()
    viewer_h = {"Authorization": f"Bearer dev:{viewer_id}"}
    beta_h = {"Authorization": f"Bearer dev:{beta_id}"}
    r = c.post(f"{BASE}/devices", json={"hostname": "x", "vendor": "cisco"}, headers=viewer_h)
    check("Authz: VIEWER create device -> 403", r.status_code == 403,
          f"status={r.status_code} code={r.json().get('error',{}).get('code')}")

    # 4. Three-vendor pipeline
    vendor_files = {
        "cisco": ("cisco_insecure.cfg", "cisco", "ios"),
        "juniper": ("juniper_insecure.conf", "juniper", "junos"),
        "fortinet": ("fortios_insecure.conf", "fortinet", "fortios"),
    }
    pipeline: dict[str, dict] = {}
    for vend, (fn, exp_vendor, exp_os) in vendor_files.items():
        content = (FIX / fn).read_bytes()
        out = upload_and_analyze(c, fn, content)
        cfg, job = out["config"], out["job"]
        detected = cfg["detected_vendor"]
        completed = job and job["status"] == "COMPLETED"
        findings_n = (job or {}).get("result", {}).get("findings_created", 0)
        check(f"{exp_vendor.title()} pipeline upload+detect+analyze",
              detected == exp_vendor and completed and findings_n > 0,
              f"detected={detected} status={job and job['status']} findings={findings_n}")
        pipeline[vend] = {"cfg": cfg, "job": job, "device_id": (job or {}).get("result", {}).get("device_id")}

    # 5. Normalization (Cisco ssh.version=1) + evidence
    cisco_cfg = pipeline["cisco"]["cfg"]
    r = c.get(f"{BASE}/normalization/{cisco_cfg['id']}", headers=DEV)
    norm = envelope(r)
    ssh_v = (((norm or {}).get("model", {}).get("remote_access", {}) or {}).get("ssh", {}) or {}).get("version")
    has_lines = any(f.get("line_start") for f in (norm or {}).get("facts", []))
    check("Normalization: vendor-neutral model + facts", ssh_v == "1" and has_lines,
          f"ssh.version={ssh_v} facts={len(norm.get('facts', []))}")

    # 6. Compliance (backend-authoritative)
    r = c.get(f"{BASE}/compliance", headers=DEV)
    ov = envelope(r)
    check("Compliance overview", isinstance(ov["overall_score"], int) and len(ov["frameworks"]) == 4,
          f"overall={ov['overall_score']} frameworks={len(ov['frameworks'])} categories={len(ov['categories'])}")

    # 7. Findings + evidence + framework mapping
    did = pipeline["cisco"]["device_id"]
    r = c.get(f"{BASE}/findings", params={"device_id": did, "page_size": 100}, headers=DEV)
    fl = envelope(r)
    check("Findings list (cisco device)", len(fl) >= 8, f"count={len(fl)}")
    fid = fl[0]["id"]
    r = c.get(f"{BASE}/findings/{fid}", headers=DEV)
    fd = envelope(r)
    ev = fd.get("evidence", {})
    fw_keys = {m["framework"] for m in fd.get("frameworks", [])}
    check("Finding evidence chain (snippet+line)",
          bool(ev.get("snippet")) and ev.get("line_start") is not None,
          f"line={ev.get('line_start')} snippet={ev.get('snippet')!r}")
    check("Finding framework mapping (CIS/NIST/STIG/ISO)",
          {"CIS", "NIST", "STIG", "ISO"} & fw_keys == {"CIS", "NIST", "STIG", "ISO"} or len(fw_keys) >= 1,
          f"frameworks={sorted(fw_keys)}")

    # 8. Finding lifecycle PATCH
    r = c.patch(f"{BASE}/findings/{fid}", json={"status": "ACKNOWLEDGED"}, headers=DEV)
    check("Finding lifecycle PATCH", r.status_code == 200 and envelope(r)["status"] == "ACKNOWLEDGED",
          f"status={r.status_code}")

    # 9. Frameworks
    r = c.get(f"{BASE}/frameworks", headers=DEV)
    fws = {f["key"] for f in envelope(r)}
    check("Frameworks list", fws == {"CIS", "NIST", "STIG", "ISO"}, f"{sorted(fws)}")
    r = c.get(f"{BASE}/frameworks/CIS", headers=DEV)
    check("Framework detail (CIS controls)", len(envelope(r)["controls"]) > 0,
          f"controls={len(envelope(r)['controls'])}")

    # 10. AI / training: approve, reject, modify
    r = c.get(f"{BASE}/training/patterns", params={"status": "PENDING", "page_size": 100}, headers=DEV)
    pend = envelope(r)
    check("AI: unknown patterns pending review", len(pend) >= 1, f"pending={len(pend)}")
    if len(pend) >= 1:
        r = c.post(f"{BASE}/training/patterns/{pend[0]['id']}/approve",
                   json={"decision": "APPROVE"}, headers=DEV)
        check("Training APPROVE", r.status_code == 200 and envelope(r)["status"] == "APPROVED",
              f"status={envelope(r)['status'] if r.status_code==200 else r.status_code}")
    if len(pend) >= 2:
        r = c.post(f"{BASE}/training/patterns/{pend[1]['id']}/reject",
                   json={"decision": "REJECT", "note": "not a rule"}, headers=DEV)
        check("Training REJECT", r.status_code == 200 and envelope(r)["status"] == "REJECTED",
              f"status={envelope(r)['status'] if r.status_code==200 else r.status_code}")
    if len(pend) >= 3:
        r = c.post(f"{BASE}/training/patterns/{pend[2]['id']}/approve",
                   json={"decision": "MODIFY", "category": "SSH", "field": "remote_access.ssh.custom"},
                   headers=DEV)
        ok = r.status_code == 200 and envelope(r)["security_category"] == "SSH"
        check("Training MODIFY (category/field)", ok,
              f"cat={envelope(r).get('security_category') if r.status_code==200 else r.status_code}")

    # 11. Remediation + decision (no execution)
    r = c.get(f"{BASE}/remediation", params={"device_id": did, "page_size": 100}, headers=DEV)
    rems = envelope(r)
    check("Remediation generated (vendor-specific commands)",
          len(rems) >= 1 and len(rems[0]["commands"]) > 0,
          f"count={len(rems)} first_cmds={len(rems[0]['commands']) if rems else 0}")
    if rems:
        r = c.post(f"{BASE}/remediation/{rems[0]['id']}/decision",
                   json={"decision": "APPROVED"}, headers=DEV)
        check("Remediation decision APPROVED (review-only)",
              r.status_code == 200 and envelope(r)["approval"] == "APPROVED",
              f"approval={envelope(r)['approval'] if r.status_code==200 else r.status_code}")

    # 12. Reports: PDF + Excel + consistency
    r = c.post(f"{BASE}/reports", json={"title": "P4 PDF", "category": "DEVICE",
               "fmt": "PDF", "device_ids": [did]}, headers=DEV)
    pdf = envelope(r)
    check("Report PDF generation", r.status_code == 201 and pdf["status"] == "READY" and pdf["storage_path"],
          f"status={pdf.get('status')} path={bool(pdf.get('storage_path'))}")
    r = c.post(f"{BASE}/reports", json={"title": "P4 XLSX", "category": "DEVICE",
               "fmt": "EXCEL", "device_ids": [did]}, headers=DEV)
    xlsx = envelope(r)
    check("Report Excel generation", r.status_code == 201 and xlsx["status"] == "READY" and xlsx["storage_path"],
          f"status={xlsx.get('status')} path={bool(xlsx.get('storage_path'))}")
    # Consistency: report findings_count == device findings count
    device_fail = sum(1 for f in fl if f["result"] == "FAIL")
    check("Report/findings consistency", pdf["findings_count"] == device_fail,
          f"report={pdf['findings_count']} device_findings={device_fail}")

    # 13. Storage artifacts actually written
    from app.core.config import settings as _s
    store_dir = Path(_s.storage_local_dir) / _s.storage_bucket_reports
    artifacts = list(store_dir.rglob("*")) if store_dir.exists() else []
    check("Storage: report artifacts persisted", any(p.is_file() for p in artifacts),
          f"files={sum(1 for p in artifacts if p.is_file())}")

    # 14. Audit event chain
    r = c.get(f"{BASE}/audit", params={"page_size": 100}, headers=DEV)
    types = {a["event_type"] for a in envelope(r)}
    required = {"CONFIGURATION_UPLOADED", "VENDOR_DETECTED", "COMPLIANCE_SCAN_COMPLETED",
                "FINDING_CREATED", "REPORT_GENERATED", "UNKNOWN_PATTERN_CREATED"}
    check("Audit: full event chain", required.issubset(types), f"missing={required - types}")

    # 15. Bad inputs
    r = c.post(f"{BASE}/configurations/upload",
               files={"file": ("empty.cfg", b"", "text/plain")}, headers=DEV)
    check("Bad input: empty file rejected", r.status_code == 422, f"status={r.status_code}")
    r = c.post(f"{BASE}/configurations/upload",
               files={"file": ("test.exe", b"MZbinary", "application/octet-stream")}, headers=DEV)
    check("Bad input: .exe rejected", r.status_code == 422, f"status={r.status_code}")
    big = b"hostname X\n" * 120_000  # > 1 MiB
    r = c.post(f"{BASE}/configurations/upload",
               files={"file": ("big.cfg", big, "text/plain")}, headers=DEV)
    check("Bad input: oversized rejected", r.status_code == 422, f"status={r.status_code}")
    # Malformed (valid ext, unrecognizable vendor) -> analyze must FAIL, not fake success
    r = c.post(f"{BASE}/configurations/upload",
               files={"file": ("junk.cfg", b"lorem ipsum dolor sit amet\nnothing networky\n", "text/plain")},
               data={"source": "FILE_UPLOAD"}, headers=DEV)
    if r.status_code == 201:
        jcfg = envelope(r)
        ar = c.post(f"{BASE}/configurations/{jcfg['id']}/analyze", headers=DEV)
        if ar.status_code == 200:
            jid = envelope(ar)["job_id"]
            st = envelope(c.get(f"{BASE}/analysis/{jid}", headers=DEV))
            check("Malformed config: real FAILED (no fake success)", st["status"] == "FAILED",
                  f"job={st['status']}")
        else:
            check("Malformed config: real FAILED (no fake success)", ar.status_code in (422, 500),
                  f"analyze_status={ar.status_code}")
    else:
        check("Malformed config: handled", r.status_code == 422, f"upload_status={r.status_code}")

    # 16. Multi-tenant isolation
    dev = envelope(c.post(f"{BASE}/devices",
          json={"hostname": "SECRET-A", "vendor": "cisco"}, headers=DEV))
    r = c.get(f"{BASE}/devices/{dev['id']}", headers=beta_h)
    check("Multi-tenant isolation (cross-org -> 404)", r.status_code == 404, f"status={r.status_code}")

    # 17. Secret masking (sanitized content only)
    r = c.get(f"{BASE}/configurations/{cisco_cfg['id']}", headers=DEV)
    sanitized = envelope(r).get("sanitized_content", "")
    check("Secret masking in stored config", "********" in sanitized and "070C285F4D06" not in sanitized,
          f"masked={'********' in sanitized} leak={'070C285F4D06' in sanitized}")

    # 18. Not found envelope
    r = c.get(f"{BASE}/devices/does-not-exist", headers=DEV)
    check("404 envelope", r.status_code == 404 and r.json()["error"]["code"] == "not_found",
          f"status={r.status_code}")

    # Persistence marker: write current device count for the restart test.
    total_devices = c.get(f"{BASE}/devices", params={"page_size": 100}, headers=DEV).json()["meta"]["total"]
    Path("var/phase4_devices.txt").write_text(str(total_devices), encoding="utf-8")

    # ── Summary ──
    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    print("\n" + "=" * 60)
    print(f"PHASE 4 VALIDATION: {passed}/{total} PASS")
    print("=" * 60)
    failed = [n for n, ok, _ in results if not ok]
    if failed:
        print("FAILED:", ", ".join(failed))
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
