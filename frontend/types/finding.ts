import type { FrameworkMapping } from "./compliance";
import type {
  ControlCategory,
  DetectionOrigin,
  FindingStatus,
  Severity,
} from "./enums";

/**
 * Canonical security finding. ONE finding -> MULTIPLE framework mappings.
 * Evidence-first: every FAIL finding carries the raw config snippet and the
 * exact source lines that produced it.
 */
export interface ComplianceFinding {
  id: string; // FND-xxxx
  ruleId: string; // RULE-xxxx
  title: string;
  deviceId: string;
  deviceHostname: string;
  vendorId: string;
  vendorName: string;
  os: string;
  category: ControlCategory;
  severity: Severity;
  status: FindingStatus;
  origin: DetectionOrigin;
  /** Short one-line summary. */
  summary: string;
  /** What was actually found. */
  currentValue: string;
  /** What compliance expects. */
  expectedValue: string;
  /** Business/security impact narrative. */
  securityImpact: string;
  /** Evidence backing the finding. */
  evidence: FindingEvidence;
  /** Framework references (CIS / NIST / STIG / ISO). */
  frameworks: FrameworkMapping[];
  /** Verification steps to confirm remediation. */
  verification: string[];
  /** Linked remediation id, if any. */
  remediationId?: string;
  detectedAt: string; // ISO
}

export interface FindingEvidence {
  configurationId: string;
  configurationName: string;
  deviceHostname: string;
  /** The offending snippet (may be masked). */
  snippet: string;
  /** Line numbers within the source configuration. */
  lines: number[];
  /** The exact expected snippet for comparison / diff. */
  expectedSnippet: string;
}
