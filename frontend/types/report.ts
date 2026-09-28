import type {
  ReportCategory,
  ReportFormat,
  ReportStatus,
  Severity,
} from "./enums";

export interface Report {
  id: string; // RPT-xxxx
  title: string;
  category: ReportCategory;
  format: ReportFormat;
  status: ReportStatus;
  /** Devices covered by this report. */
  deviceIds: string[];
  deviceCount: number;
  /** Snapshot compliance score at generation time. */
  complianceScore: number;
  findingsCount: number;
  severityBreakdown: Record<Severity, number>;
  generatedAt: string; // ISO
  generatedBy: string;
  sizeLabel: string; // e.g. "2.4 MB"
  /** Structured preview payload (no real PDF/Excel produced in Phase 1). */
  preview: ReportPreview;
}

/** Structured, renderable preview of an audit-ready report. */
export interface ReportPreview {
  executiveSummary: string;
  device: {
    hostname: string;
    vendor: string;
    model: string;
    os: string;
    ipAddress: string;
  } | null;
  complianceScore: number;
  frameworkResults: {
    framework: string;
    score: number;
    pass: number;
    fail: number;
  }[];
  findings: {
    id: string;
    title: string;
    severity: Severity;
    status: string;
    category: string;
    evidence: string;
    remediation: string;
  }[];
  auditTrailRefs: string[];
}
