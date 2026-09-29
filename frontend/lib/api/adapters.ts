/**
 * Adapters: backend DTOs (snake_case) → frontend domain types (Phase 1).
 *
 * The frontend keeps its existing types; these functions are the only place
 * that knows the backend wire shape. Some frontend fields have no backend
 * counterpart (documented in docs/phase-3-integration-map.md) and are filled
 * with safe defaults or enriched from a device lookup.
 */
import type {
  AIAnalysis,
  ComplianceFinding,
  ComplianceFramework,
  Configuration,
  ControlCategory,
  Device,
  FrameworkMapping,
  NormalizedFact,
  PatternStatus,
  Remediation,
  RemediationStatus,
  Report,
  TrainingPattern,
} from "@/types";
import type { AppNotification, AuditEvent } from "@/types";
import type {
  AuditEventDto,
  ComplianceOverviewDto,
  ConfigurationDto,
  DeviceDto,
  FindingDto,
  FrameworkDto,
  NormalizedModelDto,
  RemediationDto,
  ReportDto,
  TrainingPatternDto,
} from "./dto";

const VENDOR_NAMES: Record<string, string> = {
  cisco: "Cisco",
  juniper: "Juniper",
  fortinet: "Fortinet",
  arista: "Arista",
  paloalto: "Palo Alto",
};

export function vendorName(id: string | null | undefined): string {
  if (!id) return "Unknown";
  return VENDOR_NAMES[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

const FRAMEWORK_KEYS = new Set(["CIS", "NIST", "STIG", "ISO"]);
function frameworkId(key: string) {
  return (FRAMEWORK_KEYS.has(key) ? key : "CIS") as FrameworkMapping["frameworkId"];
}

// ── Device ──────────────────────────────────────────────────────
export function toDevice(d: DeviceDto): Device {
  return {
    id: d.id,
    hostname: d.hostname,
    vendorId: d.vendor,
    vendorName: vendorName(d.vendor),
    deviceType: (d.device_type as Device["deviceType"]) ?? "OTHER",
    model: d.model ?? "",
    os: d.os_name ?? "",
    osVersion: d.os_version ?? "",
    serialNumber: d.serial_number ?? "",
    ipAddress: d.management_ip ?? "",
    source: "FILE_UPLOAD",
    complianceScore: d.compliance_score,
    riskLevel: (d.risk_level as Device["riskLevel"]) ?? "MINIMAL",
    status: (d.status as Device["status"]) ?? "PENDING",
    // Backend DeviceRead has no per-status rollup; detail pages derive real
    // counts from the findings query.
    findingsSummary: { pass: 0, fail: 0, na: 0, unknown: 0 },
    criticalFindings: 0,
    highFindings: 0,
    lastAnalysis: d.last_analysis_at ?? d.created_at,
    createdAt: d.created_at,
    location: d.location ?? undefined,
  };
}

// ── Normalized fact ─────────────────────────────────────────────
export function toNormalizedFact(f: NormalizedModelDto["facts"][number]): NormalizedFact {
  const lines: number[] = [];
  if (f.line_start != null) {
    const end = f.line_end ?? f.line_start;
    for (let n = f.line_start; n <= end; n++) lines.push(n);
  }
  return {
    id: f.id,
    category: f.category as ControlCategory,
    field: f.field,
    label: f.label,
    value: f.value,
    origin: (f.origin as NormalizedFact["origin"]) ?? "DETERMINISTIC",
    sourceLines: lines,
    evidence: f.snippet ?? "",
    confidence: Math.round((f.confidence ?? 1) * (f.confidence <= 1 ? 100 : 1)),
  };
}

const FORMAT_BY_EXT: Record<string, Configuration["format"]> = {
  TXT: "TXT",
  CFG: "CFG",
  CONF: "CONF",
};

// ── Configuration (summary from list; full when normalized provided) ──
export function toConfiguration(
  c: ConfigurationDto,
  opts?: { deviceHostname?: string; normalized?: NormalizedModelDto | null }
): Configuration {
  const facts = (opts?.normalized?.facts ?? []).map(toNormalizedFact);
  const model = (opts?.normalized?.model ?? {
    identity: {
      hostname: opts?.deviceHostname ?? "",
      vendor: c.detected_vendor ?? "",
      os: c.detected_os ?? "",
      version: c.configuration_version ?? "",
    },
  }) as Configuration["normalized"];
  return {
    id: c.id,
    name: c.file_name,
    deviceId: c.device_id ?? "",
    deviceHostname: opts?.deviceHostname ?? "",
    vendorId: c.detected_vendor ?? "unknown",
    vendorName: vendorName(c.detected_vendor),
    os: c.detected_os ?? "",
    source: (c.source as Configuration["source"]) ?? "FILE_UPLOAD",
    format: FORMAT_BY_EXT[c.file_type?.toUpperCase()] ?? "CFG",
    syntaxStyle: (c.syntax_style as Configuration["syntaxStyle"]) ?? "FLAT",
    version: c.configuration_version ?? "",
    sizeBytes: c.size_bytes,
    lineCount: c.line_count,
    parserStatus: (c.parser_status as Configuration["parserStatus"]) ?? "PENDING",
    analysisStatus: (c.analysis_status as Configuration["analysisStatus"]) ?? "PENDING",
    collectedAt: c.created_at,
    raw: c.sanitized_content ?? "",
    normalized: model,
    securityFacts: facts,
  };
}

// ── Finding ─────────────────────────────────────────────────────
export interface DeviceLite {
  hostname: string;
  vendor: string;
  os: string;
}

export function toFinding(f: FindingDto, dev?: DeviceLite): ComplianceFinding {
  const frameworks: FrameworkMapping[] = (f.frameworks ?? []).map((m) => ({
    frameworkId: frameworkId(m.framework),
    frameworkName: m.control_title ? m.framework : m.framework,
    controlId: m.control_id,
    controlTitle: m.control_title,
  }));
  return {
    id: f.id,
    ruleId: f.rule_id,
    title: f.title,
    deviceId: f.device_id,
    deviceHostname: dev?.hostname ?? "",
    vendorId: dev?.vendor ?? "unknown",
    vendorName: vendorName(dev?.vendor),
    os: dev?.os ?? "",
    category: f.category as ControlCategory,
    severity: f.severity as ComplianceFinding["severity"],
    status: (f.result as ComplianceFinding["status"]) ?? "FAIL",
    origin: "DETERMINISTIC",
    summary: f.description ?? f.title,
    currentValue: f.actual_value ?? "",
    expectedValue: f.expected_value ?? "",
    securityImpact: f.security_impact ?? "",
    evidence: {
      configurationId: f.evidence?.configuration_id ?? f.configuration_id,
      configurationName: "",
      deviceHostname: dev?.hostname ?? "",
      snippet: f.evidence?.snippet ?? f.actual_value ?? "",
      lines:
        f.evidence?.line_start != null
          ? [f.evidence.line_start, ...(f.evidence.line_end && f.evidence.line_end !== f.evidence.line_start ? [f.evidence.line_end] : [])]
          : [],
      expectedSnippet: f.expected_value ?? "",
    },
    frameworks,
    verification: f.verification ?? [],
    remediationId: undefined,
    detectedAt: f.detected_at ?? f.created_at,
  };
}

// ── Framework ───────────────────────────────────────────────────
export function toFramework(f: FrameworkDto, score = 0): ComplianceFramework {
  return {
    id: frameworkId(f.key),
    name: f.name,
    shortName: f.key,
    version: f.version,
    description: f.description ?? "",
    score,
    controlsTotal: 0,
    controlsPass: 0,
    controlsFail: 0,
    controlsNa: 0,
    controlsUnknown: 0,
  };
}

// ── Training pattern ────────────────────────────────────────────
const PATTERN_STATUS: Record<string, PatternStatus> = {
  PENDING: "PENDING_REVIEW",
  APPROVED: "LEARNED",
  REJECTED: "REJECTED",
  DISABLED: "REJECTED",
};

export function toTrainingPattern(p: TrainingPatternDto): TrainingPattern {
  const category = (p.security_category as ControlCategory) ?? "ACCESS_CONTROL";
  const confidence = Math.round((p.ai_confidence ?? 0) * 100);
  const ai: AIAnalysis = {
    id: `ai-${p.id}`,
    interpretation: interpretationFor(category),
    suggestedCategory: category,
    suggestedField: p.normalized_field ?? "unknown.field",
    confidence,
    similarPatterns: [],
    origin: "AI_ASSISTED",
  };
  return {
    id: p.id,
    vendorId: p.vendor,
    vendorName: vendorName(p.vendor),
    os: p.os ?? "",
    snippet: p.raw_pattern,
    status: PATTERN_STATUS[p.status] ?? "PENDING_REVIEW",
    aiSuggestion: ai,
    suggestedCategory: category,
    suggestedField: p.normalized_field ?? "unknown.field",
    usageCount: p.usage_count,
    createdAt: p.created_at,
    reviewedAt: p.reviewed_at ?? undefined,
    reviewedBy: p.approved_by ?? undefined,
    reviewNote: p.review_note ?? undefined,
  };
}

function interpretationFor(category: string): string {
  return (
    {
      SSH: "Likely SSH configuration / hardening directive",
      TELNET: "Likely Telnet-related directive",
      SNMP: "Likely SNMP configuration",
      NTP: "Likely NTP configuration",
      AUTHENTICATION: "Likely authentication / login policy",
      LOGGING: "Likely logging / syslog configuration",
      ENCRYPTION: "Likely cryptography / certificate configuration",
      ACL_FIREWALL: "Likely access-control / firewall policy",
      PASSWORD_SECURITY: "Likely password security setting",
      MANAGEMENT_ACCESS: "Likely management-access configuration",
    } as Record<string, string>
  )[category] ?? "Unrecognized security-relevant configuration";
}

// ── Remediation ─────────────────────────────────────────────────
const REMEDIATION_STATUS: Record<string, RemediationStatus> = {
  GENERATED: "PROPOSED",
  REVIEW_REQUIRED: "OPEN",
  APPROVED: "APPROVED",
  APPLIED: "APPLIED",
  EXECUTED: "APPLIED",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  FAILED: "REJECTED",
};

export function toRemediation(r: RemediationDto, dev?: DeviceLite): Remediation {
  return {
    id: r.id,
    findingId: r.finding_id,
    findingTitle: r.title.replace(/^Remediate:\s*/, ""),
    deviceId: r.device_id,
    deviceHostname: dev?.hostname ?? "",
    vendorId: r.vendor,
    vendorName: vendorName(r.vendor),
    os: r.os ?? "",
    category: r.category as ControlCategory,
    severity: r.severity as Remediation["severity"],
    status: REMEDIATION_STATUS[r.status] ?? "PROPOSED",
    approval: (r.approval as Remediation["approval"]) ?? "PENDING",
    currentConfig: r.current_config ?? "",
    expectedConfig: r.expected_config ?? "",
    fixCommands: r.commands ?? [],
    verificationSteps: r.verification_steps ?? [],
    rollbackGuidance: r.rollback_steps ?? [],
    disruptive: r.disruptive,
    createdAt: r.created_at,
  };
}

// ── Report ──────────────────────────────────────────────────────
export function toReport(r: ReportDto): Report {
  const p = r.preview ?? {};
  return {
    id: r.id,
    title: r.title,
    category: (r.category as Report["category"]) ?? "DEVICE",
    format: (r.fmt as Report["format"]) ?? "PDF",
    status: (r.status as Report["status"]) ?? "READY",
    deviceIds: r.device_ids ?? [],
    deviceCount: (r.device_ids ?? []).length,
    complianceScore: r.compliance_score,
    findingsCount: r.findings_count,
    severityBreakdown: {
      CRITICAL: r.severity_breakdown?.CRITICAL ?? 0,
      HIGH: r.severity_breakdown?.HIGH ?? 0,
      MEDIUM: r.severity_breakdown?.MEDIUM ?? 0,
      LOW: r.severity_breakdown?.LOW ?? 0,
      INFO: r.severity_breakdown?.INFO ?? 0,
    },
    generatedAt: r.created_at,
    generatedBy: r.generated_by ?? "system",
    sizeLabel: r.storage_path ? "generated" : "preview",
    preview: {
      executiveSummary: p.executive_summary ?? "",
      device: p.device
        ? {
            hostname: p.device.hostname,
            vendor: p.device.vendor,
            model: p.device.model,
            os: p.device.os,
            ipAddress: p.device.management_ip,
          }
        : null,
      complianceScore: p.compliance_score ?? r.compliance_score,
      frameworkResults: (p.framework_results ?? []).map((f) => ({
        framework: f.framework,
        score: f.score,
        pass: f.passed,
        fail: f.failed,
      })),
      findings: (p.findings ?? []).map((f) => ({
        id: f.id,
        title: f.title,
        severity: f.severity as Report["preview"]["findings"][number]["severity"],
        status: f.status,
        category: f.category,
        evidence: f.evidence ?? f.actual_value ?? "",
        remediation: f.remediation ?? f.expected_value ?? "",
      })),
      auditTrailRefs: p.audit_trail_refs ?? [],
    },
  };
}

// ── Audit + notifications ───────────────────────────────────────
export function toAuditEvent(a: AuditEventDto): AuditEvent {
  return {
    id: a.id,
    type: a.event_type as AuditEvent["type"],
    title: a.title,
    description: a.description ?? "",
    actor: a.actor ?? "system",
    deviceId: a.device_id ?? undefined,
    configurationId: a.configuration_id ?? undefined,
    findingId: a.finding_id ?? undefined,
    reportId: a.report_id ?? undefined,
    patternId: a.pattern_id ?? undefined,
    severity: (a.severity as AuditEvent["severity"]) ?? undefined,
    timestamp: a.created_at,
  };
}

const NOTIFY_KIND: Record<string, AppNotification["kind"]> = {
  FINDING_CREATED: "CRITICAL_FINDING",
  COMPLIANCE_SCAN_COMPLETED: "ANALYSIS_COMPLETE",
  AI_ANALYSIS_COMPLETED: "ANALYSIS_COMPLETE",
  UNKNOWN_PATTERN_CREATED: "PATTERN_REVIEW",
  TRAINING_APPROVED: "TRAINING_APPROVED",
  REPORT_GENERATED: "REPORT_GENERATED",
};

export function auditToNotification(a: AuditEventDto): AppNotification {
  return {
    id: a.id,
    kind: NOTIFY_KIND[a.event_type] ?? "ANALYSIS_COMPLETE",
    title: a.title,
    message: a.description ?? "",
    read: false,
    timestamp: a.created_at,
    href: a.finding_id
      ? `/findings/${a.finding_id}`
      : a.device_id
        ? `/devices/${a.device_id}`
        : a.pattern_id
          ? "/training"
          : a.report_id
            ? `/reports/${a.report_id}`
            : undefined,
  };
}

export function toComplianceOverview(o: ComplianceOverviewDto) {
  return o;
}
