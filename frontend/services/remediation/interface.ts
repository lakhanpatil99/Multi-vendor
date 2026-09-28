import type { Remediation } from "@/types";

export interface RemediationService {
  list(): Promise<Remediation[]>;
  get(id: string): Promise<Remediation | null>;
  getByFinding(findingId: string): Promise<Remediation | null>;
  /** Simulate an approval decision (never executes commands). */
  decide(id: string, decision: "APPROVED" | "REJECTED"): Promise<Remediation>;
}
