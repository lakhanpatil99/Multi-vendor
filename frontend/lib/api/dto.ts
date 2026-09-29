/** Backend (FastAPI) response DTOs — snake_case, as returned by /api/v1. */

export interface DeviceDto {
  id: string;
  organization_id: string;
  hostname: string;
  vendor: string;
  device_type: string;
  model: string | null;
  serial_number: string | null;
  os_name: string | null;
  os_version: string | null;
  firmware_version: string | null;
  management_ip: string | null;
  location: string | null;
  status: string;
  compliance_score: number;
  risk_level: string;
  last_analysis_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConfigurationDto {
  id: string;
  organization_id: string;
  device_id: string | null;
  source: string;
  file_name: string;
  file_type: string;
  configuration_version: string | null;
  line_count: number;
  size_bytes: number;
  detected_vendor: string | null;
  detected_os: string | null;
  detection_confidence: number;
  syntax_style: string | null;
  parser_status: string;
  normalization_status: string;
  analysis_status: string;
  created_at: string;
  sanitized_content?: string | null;
}

export interface NormalizedFactDto {
  id: string;
  configuration_id: string;
  category: string;
  field: string;
  label: string;
  value: string;
  value_type: string;
  origin: string;
  confidence: number;
  line_start: number | null;
  line_end: number | null;
  snippet: string | null;
}

export interface NormalizedModelDto {
  configuration_id: string;
  schema_version: string;
  model: Record<string, unknown>;
  facts: NormalizedFactDto[];
}

export interface FrameworkMappingDto {
  framework: string;
  control_id: string;
  control_title: string;
}

export interface FindingDto {
  id: string;
  organization_id: string;
  device_id: string;
  configuration_id: string;
  rule_id: string;
  title: string;
  description: string | null;
  category: string;
  severity: string;
  status: string;
  result: string;
  actual_value: string | null;
  expected_value: string | null;
  security_impact: string | null;
  risk_score: number;
  evidence: {
    configuration_id?: string;
    line_start?: number | null;
    line_end?: number | null;
    snippet?: string | null;
  };
  frameworks: FrameworkMappingDto[];
  verification: string[];
  detected_at: string | null;
  created_at: string;
}

export interface FrameworkDto {
  id: string;
  key: string;
  name: string;
  version: string;
  description: string | null;
  status: string;
}

export interface ComplianceOverviewDto {
  overall_score: number;
  status_breakdown: { pass: number; fail: number; na: number; unknown: number };
  frameworks: { framework: string; score: number; passed: number; failed: number }[];
  categories: { category: string; score?: number; pass?: number; fail: number }[];
}

export interface TrainingPatternDto {
  id: string;
  organization_id: string;
  vendor: string;
  os: string | null;
  raw_pattern: string;
  normalized_field: string | null;
  security_category: string | null;
  extraction_strategy: string | null;
  ai_confidence: number;
  human_confidence: number | null;
  status: string;
  usage_count: number;
  created_by: string | null;
  approved_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

export interface RemediationDto {
  id: string;
  organization_id: string;
  finding_id: string;
  device_id: string;
  vendor: string;
  os: string | null;
  category: string;
  severity: string;
  title: string;
  current_config: string | null;
  expected_config: string | null;
  commands: string[];
  verification_steps: string[];
  rollback_steps: string[];
  disruptive: boolean;
  status: string;
  approval: string;
  created_at: string;
}

export interface ReportDto {
  id: string;
  organization_id: string;
  title: string;
  category: string;
  fmt: string;
  status: string;
  device_ids: string[];
  compliance_score: number;
  findings_count: number;
  severity_breakdown: Record<string, number>;
  storage_path: string | null;
  preview: {
    executive_summary?: string;
    device?: {
      hostname: string;
      vendor: string;
      model: string;
      os: string;
      management_ip: string;
    } | null;
    compliance_score?: number;
    framework_results?: { framework: string; score: number; passed: number; failed: number }[];
    findings?: {
      id: string;
      title: string;
      severity: string;
      status: string;
      category: string;
      actual_value?: string | null;
      expected_value?: string | null;
      evidence?: string;
      remediation?: string;
    }[];
    audit_trail_refs?: string[];
  };
  generated_by: string | null;
  created_at: string;
}

export interface AuditEventDto {
  id: string;
  organization_id: string;
  event_type: string;
  title: string;
  description: string | null;
  actor: string | null;
  severity: string | null;
  device_id: string | null;
  configuration_id: string | null;
  finding_id: string | null;
  report_id: string | null;
  pattern_id: string | null;
  job_id: string | null;
  created_at: string;
}

export interface JobDto {
  id: string;
  organization_id: string;
  job_type: string;
  resource_type: string;
  resource_id: string;
  status: string;
  progress: number;
  current_stage: string | null;
  stages: { id: string; label: string; status: string; detail?: string }[];
  result: Record<string, unknown>;
  error: string | null;
  created_at: string;
}

export interface MeDto {
  user_id: string;
  organization_id: string;
  email: string;
  role: string;
}
