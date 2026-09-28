import type { ComplianceFramework, ComplianceOverview } from "@/types";

export interface ComplianceService {
  overview(): Promise<ComplianceOverview>;
  frameworks(): Promise<ComplianceFramework[]>;
}
