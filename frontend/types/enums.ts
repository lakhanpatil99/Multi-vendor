/**
 * ANCP shared enumerations.
 * Kept as string-literal unions (not TS enums) for ergonomic JSON/mock usage
 * and easy backend contract alignment later.
 */

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type FindingStatus = "PASS" | "FAIL" | "N/A" | "UNKNOWN";

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "MINIMAL";

/** Canonical device types (extensible). */
export type DeviceType = "ROUTER" | "SWITCH" | "FIREWALL" | "WLC" | "OTHER";

/** How a configuration entered the platform. */
export type ConfigurationSource = "FILE_UPLOAD" | "SSH";

/** Raw configuration file format. */
export type ConfigurationFormat = "TXT" | "CFG" | "CONF";

/** Vendor configuration syntax style — surfaced in the config viewer. */
export type SyntaxStyle = "FLAT" | "HIERARCHICAL" | "BLOCK";

/** Device lifecycle / analysis status. */
export type DeviceStatus =
  | "ANALYZED"
  | "PROCESSING"
  | "PENDING"
  | "FAILED"
  | "NEEDS_REVIEW";

/** Configuration parser status. */
export type ParserStatus = "PARSED" | "PARTIAL" | "FAILED" | "PENDING";

/** Configuration analysis status. */
export type AnalysisStatus =
  | "COMPLETE"
  | "IN_PROGRESS"
  | "QUEUED"
  | "FAILED"
  | "NEEDS_REVIEW";

/** Deterministic vs AI-derived detection origin. */
export type DetectionOrigin = "DETERMINISTIC" | "AI_ASSISTED";

/** Framework identifiers. */
export type FrameworkId = "CIS" | "NIST" | "STIG" | "ISO";

/** Security control category — used across compliance, findings, training. */
export type ControlCategory =
  | "AUTHENTICATION"
  | "SSH"
  | "TELNET"
  | "LOGGING"
  | "ACL_FIREWALL"
  | "NTP"
  | "SNMP"
  | "ENCRYPTION"
  | "MANAGEMENT_ACCESS"
  | "PASSWORD_SECURITY"
  | "SESSION_MANAGEMENT"
  | "ACCESS_CONTROL";

/** Human-in-the-loop training pattern status. */
export type PatternStatus =
  | "UNKNOWN"
  | "PENDING_REVIEW"
  | "AI_SUGGESTED"
  | "LEARNED"
  | "REJECTED";

/** Remediation lifecycle status. */
export type RemediationStatus =
  | "OPEN"
  | "PROPOSED"
  | "APPROVED"
  | "APPLIED"
  | "VERIFIED"
  | "REJECTED";

export type ApprovalState = "PENDING" | "APPROVED" | "REJECTED";

/** Report output formats supported by the reporting center. */
export type ReportFormat = "PDF" | "EXCEL";

export type ReportCategory =
  | "DEVICE"
  | "COMPLIANCE"
  | "FRAMEWORK"
  | "FINDING"
  | "EXECUTIVE_SUMMARY";

export type ReportStatus = "READY" | "GENERATING" | "FAILED" | "DRAFT";

/** Audit event categories. */
export type AuditEventType =
  | "CONFIGURATION_UPLOADED"
  | "DEVICE_CONNECTED"
  | "VENDOR_DETECTED"
  | "CONFIGURATION_PARSED"
  | "AI_ANALYSIS_COMPLETED"
  | "UNKNOWN_PATTERN_CREATED"
  | "TRAINING_APPROVED"
  | "COMPLIANCE_SCAN_COMPLETED"
  | "FINDING_CREATED"
  | "REPORT_GENERATED";

export type NotificationKind =
  | "CRITICAL_FINDING"
  | "ANALYSIS_COMPLETE"
  | "PATTERN_REVIEW"
  | "TRAINING_APPROVED"
  | "REPORT_GENERATED"
  | "ANALYSIS_FAILED";
