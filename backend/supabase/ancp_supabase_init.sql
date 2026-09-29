-- ============================================================================
--  ANCP — Supabase PostgreSQL initialization script
-- ============================================================================
--  Target : Supabase Dashboard -> SQL Editor -> New Query -> Run
--  Source of truth : SQLAlchemy models + Alembic migrations (DO NOT REDESIGN)
--  Alembic head    : 7f1a8f8d0873
--
--  This script is a CONSOLIDATED, IDEMPOTENT representation of the two Alembic
--  migrations squashed to head:
--     8bf417ace640  (initial schema)
--     7f1a8f8d0873  (add compliance_runs.category_scores)
--  It is generated from backend/migrations/postgres_schema.sql
--  (produced offline via `alembic upgrade head --sql`) plus the idempotent
--  reference data from backend/scripts/seed.py.
--
--  Contents:
--     19 application tables + alembic_version
--     29 foreign keys
--     60 indexes
--     15 tenant-scoped tables (organization_id)
--     alembic_version stamped to '7f1a8f8d0873'
--     reference/dev seed data (frameworks, rules, mappings, dev org+user)
--
--  Safety:
--     * CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS everywhere.
--     * No DROP TABLE / DROP DATABASE / TRUNCATE / DELETE.
--     * Seed inserts are guarded (ON CONFLICT / NOT EXISTS) => re-runnable.
--     * No RLS policies (app-layer tenant scoping; see notes at end).
--     * No storage buckets (configure ancp-configurations / ancp-reports
--       separately as PRIVATE buckets).
--     * device_credential_refs stores REFERENCES only, never secrets.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- alembic_version
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- ===========================================================================
-- SCHEMA (revision 8bf417ace640 -> 7f1a8f8d0873, squashed)
-- ===========================================================================

-- ── compliance_rules (global reference) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_rules (
    rule_id VARCHAR(60) NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(40) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    target_field VARCHAR(160) NOT NULL,
    operator VARCHAR(30) NOT NULL,
    expected_value VARCHAR(200),
    on_missing VARCHAR(10) NOT NULL,
    rationale TEXT,
    enabled BOOLEAN NOT NULL,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS ix_compliance_rules_category ON compliance_rules (category);
CREATE UNIQUE INDEX IF NOT EXISTS ix_compliance_rules_rule_id ON compliance_rules (rule_id);

-- ── frameworks (global reference) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS frameworks (
    key VARCHAR(20) NOT NULL,
    name VARCHAR(120) NOT NULL,
    version VARCHAR(40) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_frameworks_key ON frameworks (key);

-- ── organizations (tenant root) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (slug)
);

-- ── analysis_jobs (tenant) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analysis_jobs (
    organization_id VARCHAR(36) NOT NULL,
    job_type VARCHAR(40) NOT NULL,
    resource_type VARCHAR(40) NOT NULL,
    resource_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL,
    progress INTEGER NOT NULL,
    current_stage VARCHAR(60),
    stages JSON NOT NULL,
    result JSON NOT NULL,
    error TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_analysis_jobs_organization_id ON analysis_jobs (organization_id);
CREATE INDEX IF NOT EXISTS ix_analysis_jobs_resource_id ON analysis_jobs (resource_id);
CREATE INDEX IF NOT EXISTS ix_analysis_jobs_status ON analysis_jobs (status);

-- ── audit_logs (tenant) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    organization_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    actor VARCHAR(255),
    severity VARCHAR(20),
    device_id VARCHAR(36),
    configuration_id VARCHAR(36),
    finding_id VARCHAR(36),
    report_id VARCHAR(36),
    pattern_id VARCHAR(36),
    job_id VARCHAR(36),
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_audit_logs_configuration_id ON audit_logs (configuration_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_device_id ON audit_logs (device_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_event_type ON audit_logs (event_type);
CREATE INDEX IF NOT EXISTS ix_audit_logs_finding_id ON audit_logs (finding_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_job_id ON audit_logs (job_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_organization_id ON audit_logs (organization_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_pattern_id ON audit_logs (pattern_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_report_id ON audit_logs (report_id);

-- ── devices (tenant) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
    organization_id VARCHAR(36) NOT NULL,
    hostname VARCHAR(255) NOT NULL,
    vendor VARCHAR(60) NOT NULL,
    device_type VARCHAR(40) NOT NULL,
    model VARCHAR(120),
    serial_number VARCHAR(120),
    os_name VARCHAR(60),
    os_version VARCHAR(60),
    firmware_version VARCHAR(60),
    management_ip VARCHAR(64),
    location VARCHAR(160),
    status VARCHAR(30) NOT NULL,
    compliance_score INTEGER NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    last_analysis_at TIMESTAMP WITH TIME ZONE,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_devices_hostname ON devices (hostname);
CREATE INDEX IF NOT EXISTS ix_devices_organization_id ON devices (organization_id);
CREATE INDEX IF NOT EXISTS ix_devices_status ON devices (status);
CREATE INDEX IF NOT EXISTS ix_devices_vendor ON devices (vendor);

-- ── framework_mappings (global reference) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS framework_mappings (
    rule_id VARCHAR(60) NOT NULL,
    framework_key VARCHAR(20) NOT NULL,
    control_id VARCHAR(60) NOT NULL,
    control_title VARCHAR(255) NOT NULL,
    rationale TEXT,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(rule_id) REFERENCES compliance_rules (rule_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_framework_mappings_framework_key ON framework_mappings (framework_key);
CREATE INDEX IF NOT EXISTS ix_framework_mappings_rule_id ON framework_mappings (rule_id);

-- ── reports (tenant) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
    organization_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(30) NOT NULL,
    format VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL,
    device_ids JSON NOT NULL,
    compliance_score INTEGER NOT NULL,
    findings_count INTEGER NOT NULL,
    severity_breakdown JSON NOT NULL,
    storage_path VARCHAR(500),
    preview JSON NOT NULL,
    generated_by VARCHAR(255),
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_reports_organization_id ON reports (organization_id);
CREATE INDEX IF NOT EXISTS ix_reports_status ON reports (status);

-- ── training_patterns (tenant) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_patterns (
    organization_id VARCHAR(36) NOT NULL,
    vendor VARCHAR(60) NOT NULL,
    os VARCHAR(60),
    raw_pattern TEXT NOT NULL,
    normalized_field VARCHAR(160),
    security_category VARCHAR(40),
    extraction_strategy VARCHAR(60),
    ai_confidence DOUBLE PRECISION NOT NULL,
    human_confidence DOUBLE PRECISION,
    status VARCHAR(20) NOT NULL,
    usage_count INTEGER NOT NULL,
    created_by VARCHAR(255),
    approved_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_note TEXT,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_training_patterns_organization_id ON training_patterns (organization_id);
CREATE INDEX IF NOT EXISTS ix_training_patterns_status ON training_patterns (status);
CREATE INDEX IF NOT EXISTS ix_training_patterns_vendor ON training_patterns (vendor);

-- ── users (tenant) ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    organization_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    role VARCHAR(40) NOT NULL,
    auth_subject VARCHAR(255),
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
    CONSTRAINT uq_user_org_email UNIQUE (organization_id, email)
);
CREATE INDEX IF NOT EXISTS ix_users_auth_subject ON users (auth_subject);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);
CREATE INDEX IF NOT EXISTS ix_users_organization_id ON users (organization_id);

-- ── ai_analysis (tenant) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_analysis (
    organization_id VARCHAR(36) NOT NULL,
    pattern_id VARCHAR(36),
    provider VARCHAR(40) NOT NULL,
    interpretation TEXT,
    suggested_category VARCHAR(40),
    suggested_field VARCHAR(160),
    confidence DOUBLE PRECISION NOT NULL,
    similar_patterns JSON NOT NULL,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
    FOREIGN KEY(pattern_id) REFERENCES training_patterns (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS ix_ai_analysis_organization_id ON ai_analysis (organization_id);
CREATE INDEX IF NOT EXISTS ix_ai_analysis_pattern_id ON ai_analysis (pattern_id);

-- ── configurations (tenant) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configurations (
    organization_id VARCHAR(36) NOT NULL,
    device_id VARCHAR(36),
    source VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    configuration_version VARCHAR(60),
    raw_storage_path VARCHAR(500),
    sanitized_content TEXT,
    line_count INTEGER NOT NULL,
    size_bytes INTEGER NOT NULL,
    detected_vendor VARCHAR(60),
    detected_os VARCHAR(60),
    detection_confidence DOUBLE PRECISION NOT NULL,
    syntax_style VARCHAR(20),
    parser_status VARCHAR(20) NOT NULL,
    normalization_status VARCHAR(20) NOT NULL,
    analysis_status VARCHAR(20) NOT NULL,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(device_id) REFERENCES devices (id) ON DELETE SET NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_configurations_analysis_status ON configurations (analysis_status);
CREATE INDEX IF NOT EXISTS ix_configurations_detected_vendor ON configurations (detected_vendor);
CREATE INDEX IF NOT EXISTS ix_configurations_device_id ON configurations (device_id);
CREATE INDEX IF NOT EXISTS ix_configurations_organization_id ON configurations (organization_id);

-- ── device_credential_refs (tenant) — REFERENCES ONLY, never secrets ─────────
CREATE TABLE IF NOT EXISTS device_credential_refs (
    organization_id VARCHAR(36) NOT NULL,
    device_id VARCHAR(36) NOT NULL,
    method VARCHAR(20) NOT NULL,
    username VARCHAR(120),
    credential_reference VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(device_id) REFERENCES devices (id) ON DELETE CASCADE,
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_device_credential_refs_device_id ON device_credential_refs (device_id);
CREATE INDEX IF NOT EXISTS ix_device_credential_refs_organization_id ON device_credential_refs (organization_id);

-- ── training_feedback (tenant) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_feedback (
    organization_id VARCHAR(36) NOT NULL,
    pattern_id VARCHAR(36) NOT NULL,
    decision VARCHAR(20) NOT NULL,
    category VARCHAR(40),
    field VARCHAR(160),
    note TEXT,
    actor VARCHAR(255),
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
    FOREIGN KEY(pattern_id) REFERENCES training_patterns (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_training_feedback_organization_id ON training_feedback (organization_id);
CREATE INDEX IF NOT EXISTS ix_training_feedback_pattern_id ON training_feedback (pattern_id);

-- ── compliance_runs (tenant) — includes category_scores (rev 7f1a8f8d0873) ───
CREATE TABLE IF NOT EXISTS compliance_runs (
    organization_id VARCHAR(36) NOT NULL,
    device_id VARCHAR(36) NOT NULL,
    configuration_id VARCHAR(36) NOT NULL,
    overall_score INTEGER NOT NULL,
    total_rules INTEGER NOT NULL,
    passed INTEGER NOT NULL,
    failed INTEGER NOT NULL,
    not_applicable INTEGER NOT NULL,
    unknown INTEGER NOT NULL,
    framework_scores JSON NOT NULL,
    category_scores JSON NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(configuration_id) REFERENCES configurations (id) ON DELETE CASCADE,
    FOREIGN KEY(device_id) REFERENCES devices (id) ON DELETE CASCADE,
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);
-- Defensive self-heal for a DB left at revision 8bf417ace640 (pre-category_scores).
-- No-op on a fresh full create (column already defined above). Safe only while
-- the table is empty; if compliance_runs already holds rows without this column,
-- run the real Alembic migration instead (see WARNINGS in the report).
ALTER TABLE compliance_runs ADD COLUMN IF NOT EXISTS category_scores JSON NOT NULL;
CREATE INDEX IF NOT EXISTS ix_compliance_runs_configuration_id ON compliance_runs (configuration_id);
CREATE INDEX IF NOT EXISTS ix_compliance_runs_device_id ON compliance_runs (device_id);
CREATE INDEX IF NOT EXISTS ix_compliance_runs_organization_id ON compliance_runs (organization_id);

-- ── normalized_configurations (tenant) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS normalized_configurations (
    organization_id VARCHAR(36) NOT NULL,
    configuration_id VARCHAR(36) NOT NULL,
    model JSON NOT NULL,
    schema_version VARCHAR(20) NOT NULL,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(configuration_id) REFERENCES configurations (id) ON DELETE CASCADE,
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_normalized_configurations_configuration_id ON normalized_configurations (configuration_id);
CREATE INDEX IF NOT EXISTS ix_normalized_configurations_organization_id ON normalized_configurations (organization_id);

-- ── normalized_facts (tenant) — evidence: line_start/line_end/snippet ────────
CREATE TABLE IF NOT EXISTS normalized_facts (
    organization_id VARCHAR(36) NOT NULL,
    configuration_id VARCHAR(36) NOT NULL,
    category VARCHAR(40) NOT NULL,
    field VARCHAR(160) NOT NULL,
    label VARCHAR(160) NOT NULL,
    value VARCHAR(500) NOT NULL,
    value_type VARCHAR(20) NOT NULL,
    origin VARCHAR(20) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    line_start INTEGER,
    line_end INTEGER,
    snippet VARCHAR(500),
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(configuration_id) REFERENCES configurations (id) ON DELETE CASCADE,
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_normalized_facts_category ON normalized_facts (category);
CREATE INDEX IF NOT EXISTS ix_normalized_facts_configuration_id ON normalized_facts (configuration_id);
CREATE INDEX IF NOT EXISTS ix_normalized_facts_field ON normalized_facts (field);
CREATE INDEX IF NOT EXISTS ix_normalized_facts_organization_id ON normalized_facts (organization_id);

-- ── findings (tenant) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS findings (
    organization_id VARCHAR(36) NOT NULL,
    device_id VARCHAR(36) NOT NULL,
    configuration_id VARCHAR(36) NOT NULL,
    run_id VARCHAR(36),
    rule_id VARCHAR(60) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(40) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    result VARCHAR(10) NOT NULL,
    actual_value VARCHAR(500),
    expected_value VARCHAR(500),
    security_impact TEXT,
    risk_score INTEGER NOT NULL,
    evidence JSON NOT NULL,
    frameworks JSON NOT NULL,
    verification JSON NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(configuration_id) REFERENCES configurations (id) ON DELETE CASCADE,
    FOREIGN KEY(device_id) REFERENCES devices (id) ON DELETE CASCADE,
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
    FOREIGN KEY(run_id) REFERENCES compliance_runs (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS ix_findings_category ON findings (category);
CREATE INDEX IF NOT EXISTS ix_findings_configuration_id ON findings (configuration_id);
CREATE INDEX IF NOT EXISTS ix_findings_device_id ON findings (device_id);
CREATE INDEX IF NOT EXISTS ix_findings_organization_id ON findings (organization_id);
CREATE INDEX IF NOT EXISTS ix_findings_rule_id ON findings (rule_id);
CREATE INDEX IF NOT EXISTS ix_findings_run_id ON findings (run_id);
CREATE INDEX IF NOT EXISTS ix_findings_severity ON findings (severity);
CREATE INDEX IF NOT EXISTS ix_findings_status ON findings (status);

-- ── remediations (tenant) — execution disabled by design ────────────────────
CREATE TABLE IF NOT EXISTS remediations (
    organization_id VARCHAR(36) NOT NULL,
    finding_id VARCHAR(36) NOT NULL,
    device_id VARCHAR(36) NOT NULL,
    vendor VARCHAR(60) NOT NULL,
    os VARCHAR(60),
    category VARCHAR(40) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    current_config TEXT,
    expected_config TEXT,
    commands JSON NOT NULL,
    verification_steps JSON NOT NULL,
    rollback_steps JSON NOT NULL,
    disruptive BOOLEAN NOT NULL,
    status VARCHAR(20) NOT NULL,
    approval VARCHAR(20) NOT NULL,
    id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(device_id) REFERENCES devices (id) ON DELETE CASCADE,
    FOREIGN KEY(finding_id) REFERENCES findings (id) ON DELETE CASCADE,
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_remediations_device_id ON remediations (device_id);
CREATE INDEX IF NOT EXISTS ix_remediations_finding_id ON remediations (finding_id);
CREATE INDEX IF NOT EXISTS ix_remediations_organization_id ON remediations (organization_id);
CREATE INDEX IF NOT EXISTS ix_remediations_status ON remediations (status);
CREATE INDEX IF NOT EXISTS ix_remediations_vendor ON remediations (vendor);

-- ===========================================================================
-- ALEMBIC VERSION STAMP  (must equal head so `alembic current` == 7f1a8f8d0873)
-- ===========================================================================
INSERT INTO alembic_version (version_num)
VALUES ('7f1a8f8d0873')
ON CONFLICT (version_num) DO NOTHING;

-- ===========================================================================
-- REFERENCE / DEV SEED DATA  (reproduces backend/scripts/seed.py — idempotent)
--   * frameworks (CIS / NIST / STIG / ISO)
--   * canonical compliance_rules (12)
--   * framework_mappings (48)
--   * dev organization "Acme NetOps" (slug: acme-netops)
--   * dev user analyst@acme.example (role ADMIN)
-- NO fake devices / configurations / findings / reports are inserted.
-- ids use gen_random_uuid()::text (matches VARCHAR(36) uuid4-string PKs).
-- ===========================================================================

-- ── Frameworks ──────────────────────────────────────────────────────────────
INSERT INTO frameworks (id, key, name, version, description, status, created_at, updated_at)
SELECT gen_random_uuid()::text, v.key, v.name, v.version, v.description, 'ACTIVE', now(), now()
FROM (VALUES
    ('CIS',  'CIS Benchmarks',  'v8.1',    'Center for Internet Security configuration benchmarks.'),
    ('NIST', 'NIST SP 800-53',  'Rev.5',   'US federal security & privacy control catalog.'),
    ('STIG', 'DISA STIG',       '2026-Q2', 'Defense Information Systems Agency hardening guides.'),
    ('ISO',  'ISO/IEC 27001',   '2022',    'International information security management standard.')
) AS v(key, name, version, description)
ON CONFLICT (key) DO NOTHING;

-- ── Compliance rules ────────────────────────────────────────────────────────
INSERT INTO compliance_rules
    (id, rule_id, title, category, severity, description, target_field, operator,
     expected_value, on_missing, rationale, enabled, created_at, updated_at)
SELECT gen_random_uuid()::text, v.rule_id, v.title, v.category, v.severity, v.description,
       v.target_field, v.operator, v.expected_value, v.on_missing, v.rationale, TRUE, now(), now()
FROM (VALUES
    ('TELNET-DISABLED-001', 'Telnet Must Be Disabled', 'TELNET', 'CRITICAL',
     'Telnet transmits credentials in cleartext; only SSH should be used.',
     'remote_access.telnet.enabled', 'is_false', 'false', 'PASS',
     'Telnet exposes administrative credentials and session data to on-path attackers. Disable Telnet and use SSHv2 for management.'),
    ('SSH-VERSION-001', 'SSH Protocol Version 2 Required', 'SSH', 'HIGH',
     'SSHv1 has known cryptographic weaknesses; require SSHv2.',
     'remote_access.ssh.version', 'equals', '2', 'UNKNOWN',
     'SSHv1 is vulnerable to integrity and man-in-the-middle attacks. Only SSHv2 should be permitted for device management.'),
    ('SNMP-DEFAULT-001', 'No Default SNMP Community Strings', 'SNMP', 'CRITICAL',
     'Default community strings (public/private) must not be configured.',
     'snmp.default_community', 'is_false', 'false', 'PASS',
     'Default SNMP community strings allow trivial reconnaissance and, for read-write, remote reconfiguration of the device.'),
    ('SNMP-RW-001', 'No Read-Write SNMP Community', 'SNMP', 'HIGH',
     'Read-write SNMP communities permit remote reconfiguration.',
     'snmp.rw_community', 'is_false', 'false', 'PASS',
     'A read-write community enables remote modification of device state.'),
    ('LOG-BUFFERED-001', 'Buffered Logging Enabled', 'LOGGING', 'HIGH',
     'Local buffered logging must be enabled for an audit trail.',
     'logging.buffered.enabled', 'is_true', 'true', 'FAIL',
     'Without logging there is no audit trail for security events.'),
    ('NTP-CONFIG-001', 'NTP Configured', 'NTP', 'MEDIUM',
     'A trusted NTP source must be configured for accurate time.',
     'ntp.configured', 'is_true', 'true', 'FAIL',
     'Incorrect time breaks log correlation and certificate validation.'),
    ('NTP-VALID-001', 'NTP Server Address Valid', 'NTP', 'LOW',
     'The configured NTP server must be a valid, reachable address.',
     'ntp.valid_server', 'is_true', 'true', 'N/A',
     'An invalid NTP server (e.g. 0.0.0.0) leaves the clock unsynchronized.'),
    ('AAA-ENABLED-001', 'Centralized AAA Enabled', 'AUTHENTICATION', 'HIGH',
     'Centralized AAA (TACACS+/RADIUS) should be enabled.',
     'authentication.aaa.enabled', 'is_true', 'true', 'FAIL',
     'Without AAA there is no centralized authN/authZ or command accounting.'),
    ('PWD-ENCRYPT-001', 'Password Encryption Service Enabled', 'PASSWORD_SECURITY', 'MEDIUM',
     'Stored passwords must be encrypted in the configuration.',
     'password_security.service_encryption', 'is_true', 'true', 'FAIL',
     'Cleartext passwords can be exposed via backups or unauthorized access.'),
    ('ACL-PERMIT-ANY-001', 'No Permit-Any Access Rule', 'ACL_FIREWALL', 'HIGH',
     'Access rules must follow least privilege; no permit-any.',
     'access_control.permit_any', 'is_false', 'false', 'PASS',
     'A permit-any rule provides no filtering and defeats access control.'),
    ('MGMT-WAN-001', 'Management Not Exposed on WAN', 'MANAGEMENT_ACCESS', 'CRITICAL',
     'Management services must not be reachable from untrusted interfaces.',
     'management_access.wan_exposed', 'is_false', 'false', 'PASS',
     'Exposing management on the WAN invites brute-force and exploitation.'),
    ('SESSION-CONSOLE-001', 'Console Idle Timeout Enforced', 'SESSION_MANAGEMENT', 'LOW',
     'Console sessions must time out when idle.',
     'session_management.console.exec_timeout', 'not_equals', '0 0', 'N/A',
     'Unattended sessions left open enable unauthorized console access.')
) AS v(rule_id, title, category, severity, description, target_field, operator,
       expected_value, on_missing, rationale)
ON CONFLICT (rule_id) DO NOTHING;

-- ── Framework mappings (anti-join keeps this re-runnable) ────────────────────
INSERT INTO framework_mappings (id, rule_id, framework_key, control_id, control_title, created_at, updated_at)
SELECT gen_random_uuid()::text, v.rule_id, v.framework_key, v.control_id, v.control_title, now(), now()
FROM (VALUES
    ('TELNET-DISABLED-001', 'CIS',  'CIS 1.2.4',        'Disable Telnet / use SSH only'),
    ('TELNET-DISABLED-001', 'NIST', 'AC-17(2)',         'Remote Access — Encryption'),
    ('TELNET-DISABLED-001', 'STIG', 'NET0405',          'Insecure management protocol'),
    ('TELNET-DISABLED-001', 'ISO',  'A.8.20',           'Network security controls'),
    ('SSH-VERSION-001',     'CIS',  'CIS 1.5.2',        'Set SSH version to 2'),
    ('SSH-VERSION-001',     'NIST', 'SC-8',             'Transmission Confidentiality/Integrity'),
    ('SSH-VERSION-001',     'STIG', 'NET1638',          'SSHv1 must be disabled'),
    ('SSH-VERSION-001',     'ISO',  'A.8.24',           'Use of cryptography'),
    ('SNMP-DEFAULT-001',    'CIS',  'CIS 2.3.1',        'Use SNMPv3, remove defaults'),
    ('SNMP-DEFAULT-001',    'NIST', 'IA-5',             'Authenticator Management'),
    ('SNMP-DEFAULT-001',    'STIG', 'NET0894',          'Default SNMP community strings'),
    ('SNMP-DEFAULT-001',    'ISO',  'A.5.17',           'Authentication information'),
    ('SNMP-RW-001',         'CIS',  'CIS 2.3.2',        'No RW SNMP'),
    ('SNMP-RW-001',         'NIST', 'AC-6',             'Least Privilege'),
    ('SNMP-RW-001',         'STIG', 'NET0897',          'SNMP write access restricted'),
    ('SNMP-RW-001',         'ISO',  'A.8.2',            'Privileged access rights'),
    ('LOG-BUFFERED-001',    'CIS',  'CIS 3.1.1',        'Enable logging'),
    ('LOG-BUFFERED-001',    'NIST', 'AU-2',             'Event Logging'),
    ('LOG-BUFFERED-001',    'STIG', 'NET0405',          'Logging must be enabled'),
    ('LOG-BUFFERED-001',    'ISO',  'A.8.15',           'Logging'),
    ('NTP-CONFIG-001',      'CIS',  'CIS 2.4.1',        'Configure trusted NTP'),
    ('NTP-CONFIG-001',      'NIST', 'AU-8',             'Time Stamps'),
    ('NTP-CONFIG-001',      'STIG', 'NET0813',          'Authenticated NTP required'),
    ('NTP-CONFIG-001',      'ISO',  'A.8.17',           'Clock synchronization'),
    ('NTP-VALID-001',       'CIS',  'CIS 2.4.2',        'Valid NTP server'),
    ('NTP-VALID-001',       'NIST', 'AU-8',             'Time Stamps'),
    ('NTP-VALID-001',       'STIG', 'NET0814',          'NTP source valid'),
    ('NTP-VALID-001',       'ISO',  'A.8.17',           'Clock synchronization'),
    ('AAA-ENABLED-001',     'CIS',  'CIS 1.1.1',        'Enable AAA'),
    ('AAA-ENABLED-001',     'NIST', 'AC-2',             'Account Management'),
    ('AAA-ENABLED-001',     'STIG', 'NET1623',          'AAA services required'),
    ('AAA-ENABLED-001',     'ISO',  'A.5.15',           'Access control'),
    ('PWD-ENCRYPT-001',     'CIS',  'CIS 1.4.1',        'Encrypt stored passwords'),
    ('PWD-ENCRYPT-001',     'NIST', 'IA-5(1)',          'Password-based Authentication'),
    ('PWD-ENCRYPT-001',     'STIG', 'NET1653',          'Password encryption required'),
    ('PWD-ENCRYPT-001',     'ISO',  'A.5.17',           'Authentication information'),
    ('ACL-PERMIT-ANY-001',  'CIS',  'CIS 3.3.1',        'Apply least-privilege ACLs'),
    ('ACL-PERMIT-ANY-001',  'NIST', 'AC-4',             'Information Flow Enforcement'),
    ('ACL-PERMIT-ANY-001',  'STIG', 'NET0966',          'Permit-any prohibited'),
    ('ACL-PERMIT-ANY-001',  'ISO',  'A.8.20',           'Network security controls'),
    ('MGMT-WAN-001',        'CIS',  'CIS 2.1.1',        'Restrict management access'),
    ('MGMT-WAN-001',        'NIST', 'AC-17',            'Remote Access'),
    ('MGMT-WAN-001',        'STIG', 'FGFW-ND-000125',   'Restrict management plane'),
    ('MGMT-WAN-001',        'ISO',  'A.8.20',           'Network security controls'),
    ('SESSION-CONSOLE-001', 'CIS',  'CIS 1.6.1',        'Set session timeout'),
    ('SESSION-CONSOLE-001', 'NIST', 'AC-12',            'Session Termination'),
    ('SESSION-CONSOLE-001', 'STIG', 'NET1639',          'Idle timeout required'),
    ('SESSION-CONSOLE-001', 'ISO',  'A.8.5',            'Secure authentication')
) AS v(rule_id, framework_key, control_id, control_title)
WHERE NOT EXISTS (
    SELECT 1 FROM framework_mappings fm
    WHERE fm.rule_id = v.rule_id
      AND fm.framework_key = v.framework_key
      AND fm.control_id = v.control_id
);

-- ── Dev organization ────────────────────────────────────────────────────────
INSERT INTO organizations (id, name, slug, created_at, updated_at)
SELECT gen_random_uuid()::text, 'Acme NetOps', 'acme-netops', now(), now()
ON CONFLICT (slug) DO NOTHING;

-- ── Dev user (bound to the dev org; org+email uniqueness) ─────────────────────
INSERT INTO users (id, organization_id, email, full_name, role, created_at, updated_at)
SELECT gen_random_uuid()::text, o.id, 'analyst@acme.example', 'Dev Analyst', 'ADMIN', now(), now()
FROM organizations o
WHERE o.slug = 'acme-netops'
  AND NOT EXISTS (
      SELECT 1 FROM users u
      WHERE u.organization_id = o.id AND u.email = 'analyst@acme.example'
  );

COMMIT;

-- ============================================================================
-- POST-RUN VERIFICATION (optional — run these SELECTs after the script)
-- ============================================================================
-- Expect 20 tables (19 app + alembic_version):
--   SELECT count(*) FROM information_schema.tables
--   WHERE table_schema='public'
--     AND table_name IN (
--       'organizations','users','devices','device_credential_refs','configurations',
--       'normalized_configurations','normalized_facts','frameworks','compliance_rules',
--       'framework_mappings','compliance_runs','findings','remediations',
--       'training_patterns','training_feedback','ai_analysis','reports','audit_logs',
--       'analysis_jobs','alembic_version');
--
-- Expect '7f1a8f8d0873':
--   SELECT version_num FROM alembic_version;
--
-- Expect 29 foreign keys:
--   SELECT count(*) FROM information_schema.table_constraints
--   WHERE table_schema='public' AND constraint_type='FOREIGN KEY';
--
-- Expect 4 frameworks, 12 rules, 48 mappings:
--   SELECT (SELECT count(*) FROM frameworks)         AS frameworks,
--          (SELECT count(*) FROM compliance_rules)   AS rules,
--          (SELECT count(*) FROM framework_mappings) AS mappings;
-- ============================================================================

-- ============================================================================
-- NOTES
-- ============================================================================
-- RLS: intentionally NOT enabled. The FastAPI backend connects with a single
--   privileged DATABASE_URL and enforces tenant isolation via organization_id
--   scoping in the repository/service layer. Enabling RLS with a permissive
--   USING(true) policy would add no protection; enabling restrictive RLS
--   without wiring request-scoped JWT claims would break the backend service
--   connection. RLS may be added later as defense-in-depth once the auth
--   architecture is finalized.
--
-- STORAGE: create two PRIVATE buckets separately (not from SQL):
--   ancp-configurations, ancp-reports. Never make them public.
--
-- SECRETS: device_credential_refs and audit_logs store references/metadata
--   only — never passwords, tokens, private keys, or service-role keys.
-- ============================================================================
