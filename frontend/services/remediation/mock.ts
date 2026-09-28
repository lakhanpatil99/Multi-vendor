import {
  MOCK_REMEDIATIONS,
  getRemediation,
  getRemediationByFinding,
} from "@/mock";
import { delay } from "@/lib/utils";
import type { Remediation } from "@/types";
import type { RemediationService } from "./interface";

export class MockRemediationService implements RemediationService {
  async list(): Promise<Remediation[]> {
    await delay(160);
    return [...MOCK_REMEDIATIONS];
  }

  async get(id: string): Promise<Remediation | null> {
    await delay(110);
    return getRemediation(id) ?? null;
  }

  async getByFinding(findingId: string): Promise<Remediation | null> {
    await delay(110);
    return getRemediationByFinding(findingId) ?? null;
  }

  async decide(
    id: string,
    decision: "APPROVED" | "REJECTED"
  ): Promise<Remediation> {
    await delay(350);
    const base = getRemediation(id);
    if (!base) throw new Error("Remediation not found");
    // Phase 1: approval is recorded conceptually only; NOTHING is executed.
    return {
      ...base,
      approval: decision,
      status: decision === "APPROVED" ? "APPROVED" : "REJECTED",
    };
  }
}
