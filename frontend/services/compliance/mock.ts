import { MOCK_COMPLIANCE_OVERVIEW, MOCK_FRAMEWORKS } from "@/mock";
import { delay } from "@/lib/utils";
import type { ComplianceFramework, ComplianceOverview } from "@/types";
import type { ComplianceService } from "./interface";

export class MockComplianceService implements ComplianceService {
  async overview(): Promise<ComplianceOverview> {
    await delay(200);
    return MOCK_COMPLIANCE_OVERVIEW;
  }

  async frameworks(): Promise<ComplianceFramework[]> {
    await delay(120);
    return [...MOCK_FRAMEWORKS];
  }
}
