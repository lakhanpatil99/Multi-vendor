BEGIN;

CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> 8bf417ace640

CREATE TABLE compliance_rules (
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

CREATE INDEX ix_compliance_rules_category ON compliance_rules (category);

CREATE UNIQUE INDEX ix_compliance_rules_rule_id ON compliance_rules (rule_id);

CREATE TABLE frameworks (
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

CREATE UNIQUE INDEX ix_frameworks_key ON frameworks (key);

CREATE TABLE organizations (
    name VARCHAR(200) NOT NULL, 
    slug VARCHAR(120) NOT NULL, 
    id VARCHAR(36) NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (slug)
);

CREATE TABLE analysis_jobs (
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

CREATE INDEX ix_analysis_jobs_organization_id ON analysis_jobs (organization_id);

CREATE INDEX ix_analysis_jobs_resource_id ON analysis_jobs (resource_id);

CREATE INDEX ix_analysis_jobs_status ON analysis_jobs (status);

CREATE TABLE audit_logs (
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

CREATE INDEX ix_audit_logs_configuration_id ON audit_logs (configuration_id);

CREATE INDEX ix_audit_logs_device_id ON audit_logs (device_id);

CREATE INDEX ix_audit_logs_event_type ON audit_logs (event_type);

CREATE INDEX ix_audit_logs_finding_id ON audit_logs (finding_id);

CREATE INDEX ix_audit_logs_job_id ON audit_logs (job_id);

CREATE INDEX ix_audit_logs_organization_id ON audit_logs (organization_id);

CREATE INDEX ix_audit_logs_pattern_id ON audit_logs (pattern_id);

CREATE INDEX ix_audit_logs_report_id ON audit_logs (report_id);

CREATE TABLE devices (
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

CREATE INDEX ix_devices_hostname ON devices (hostname);

CREATE INDEX ix_devices_organization_id ON devices (organization_id);

CREATE INDEX ix_devices_status ON devices (status);

CREATE INDEX ix_devices_vendor ON devices (vendor);

CREATE TABLE framework_mappings (
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

CREATE INDEX ix_framework_mappings_framework_key ON framework_mappings (framework_key);

CREATE INDEX ix_framework_mappings_rule_id ON framework_mappings (rule_id);

CREATE TABLE reports (
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

CREATE INDEX ix_reports_organization_id ON reports (organization_id);

CREATE INDEX ix_reports_status ON reports (status);

CREATE TABLE training_patterns (
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

CREATE INDEX ix_training_patterns_organization_id ON training_patterns (organization_id);

CREATE INDEX ix_training_patterns_status ON training_patterns (status);

CREATE INDEX ix_training_patterns_vendor ON training_patterns (vendor);

CREATE TABLE users (
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

CREATE INDEX ix_users_auth_subject ON users (auth_subject);

CREATE INDEX ix_users_email ON users (email);

CREATE INDEX ix_users_organization_id ON users (organization_id);

CREATE TABLE ai_analysis (
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

CREATE INDEX ix_ai_analysis_organization_id ON ai_analysis (organization_id);

CREATE INDEX ix_ai_analysis_pattern_id ON ai_analysis (pattern_id);

CREATE TABLE configurations (
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

CREATE INDEX ix_configurations_analysis_status ON configurations (analysis_status);

CREATE INDEX ix_configurations_detected_vendor ON configurations (detected_vendor);

CREATE INDEX ix_configurations_device_id ON configurations (device_id);

CREATE INDEX ix_configurations_organization_id ON configurations (organization_id);

CREATE TABLE device_credential_refs (
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

CREATE INDEX ix_device_credential_refs_device_id ON device_credential_refs (device_id);

CREATE INDEX ix_device_credential_refs_organization_id ON device_credential_refs (organization_id);

CREATE TABLE training_feedback (
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

CREATE INDEX ix_training_feedback_organization_id ON training_feedback (organization_id);

CREATE INDEX ix_training_feedback_pattern_id ON training_feedback (pattern_id);

CREATE TABLE compliance_runs (
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
    completed_at TIMESTAMP WITH TIME ZONE, 
    id VARCHAR(36) NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(configuration_id) REFERENCES configurations (id) ON DELETE CASCADE, 
    FOREIGN KEY(device_id) REFERENCES devices (id) ON DELETE CASCADE, 
    FOREIGN KEY(organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

CREATE INDEX ix_compliance_runs_configuration_id ON compliance_runs (configuration_id);

CREATE INDEX ix_compliance_runs_device_id ON compliance_runs (device_id);

CREATE INDEX ix_compliance_runs_organization_id ON compliance_runs (organization_id);

CREATE TABLE normalized_configurations (
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

CREATE INDEX ix_normalized_configurations_configuration_id ON normalized_configurations (configuration_id);

CREATE INDEX ix_normalized_configurations_organization_id ON normalized_configurations (organization_id);

CREATE TABLE normalized_facts (
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

CREATE INDEX ix_normalized_facts_category ON normalized_facts (category);

CREATE INDEX ix_normalized_facts_configuration_id ON normalized_facts (configuration_id);

CREATE INDEX ix_normalized_facts_field ON normalized_facts (field);

CREATE INDEX ix_normalized_facts_organization_id ON normalized_facts (organization_id);

CREATE TABLE findings (
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

CREATE INDEX ix_findings_category ON findings (category);

CREATE INDEX ix_findings_configuration_id ON findings (configuration_id);

CREATE INDEX ix_findings_device_id ON findings (device_id);

CREATE INDEX ix_findings_organization_id ON findings (organization_id);

CREATE INDEX ix_findings_rule_id ON findings (rule_id);

CREATE INDEX ix_findings_run_id ON findings (run_id);

CREATE INDEX ix_findings_severity ON findings (severity);

CREATE INDEX ix_findings_status ON findings (status);

CREATE TABLE remediations (
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

CREATE INDEX ix_remediations_device_id ON remediations (device_id);

CREATE INDEX ix_remediations_finding_id ON remediations (finding_id);

CREATE INDEX ix_remediations_organization_id ON remediations (organization_id);

CREATE INDEX ix_remediations_status ON remediations (status);

CREATE INDEX ix_remediations_vendor ON remediations (vendor);

INSERT INTO alembic_version (version_num) VALUES ('8bf417ace640') RETURNING alembic_version.version_num;

-- Running upgrade 8bf417ace640 -> 7f1a8f8d0873

ALTER TABLE compliance_runs ADD COLUMN category_scores JSON NOT NULL;

UPDATE alembic_version SET version_num='7f1a8f8d0873' WHERE alembic_version.version_num = '8bf417ace640';

COMMIT;

