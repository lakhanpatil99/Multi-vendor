import type {
  ApprovalState,
  ControlCategory,
  RemediationStatus,
  Severity,
} from "./enums";

/**
 * Vendor-specific remediation for a finding.
 * Phase 1 ONLY displays simulated commands — nothing is ever executed.
 */
export interface Remediation {
  id: string; // REM-xxxx
  findingId: string;
  findingTitle: string;
  deviceId: string;
  deviceHostname: string;
  vendorId: string;
  vendorName: string;
  os: string;
  category: ControlCategory;
  severity: Severity;
  status: RemediationStatus;
  approval: ApprovalState;
  /** Current (non-compliant) configuration. */
  currentConfig: string;
  /** Expected compliant configuration. */
  expectedConfig: string;
  /** Vendor-specific fix commands (simulated / never executed). */
  fixCommands: string[];
  /** Steps to verify the fix took effect. */
  verificationSteps: string[];
  /** Guidance to roll back if the change causes issues. */
  rollbackGuidance: string[];
  /** Whether applying is disruptive / requires a maintenance window. */
  disruptive: boolean;
  createdAt: string; // ISO
}
