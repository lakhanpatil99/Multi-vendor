import type { ComplianceFinding, ControlCategory, Severity } from "@/types";

export interface FindingQuery {
  deviceId?: string;
  vendorId?: string;
  category?: ControlCategory;
  severity?: Severity;
  status?: string;
  search?: string;
}

export interface FindingService {
  list(query?: FindingQuery): Promise<ComplianceFinding[]>;
  get(id: string): Promise<ComplianceFinding | null>;
}
