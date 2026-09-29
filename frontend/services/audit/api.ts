import { api } from "@/lib/api/client";
import { auditToNotification, toAuditEvent } from "@/lib/api/adapters";
import type { AuditEventDto } from "@/lib/api/dto";
import type { AppNotification, AuditEvent } from "@/types";
import type { AuditService } from "./interface";

const NOTIFY_TYPES = new Set([
  "FINDING_CREATED",
  "COMPLIANCE_SCAN_COMPLETED",
  "AI_ANALYSIS_COMPLETED",
  "UNKNOWN_PATTERN_CREATED",
  "TRAINING_APPROVED",
  "REPORT_GENERATED",
]);

export class ApiAuditService implements AuditService {
  async events(): Promise<AuditEvent[]> {
    const { data } = await api.getPaged<AuditEventDto[]>("/audit", { page_size: 100 });
    return data.map(toAuditEvent);
  }

  async notifications(): Promise<AppNotification[]> {
    const { data } = await api.getPaged<AuditEventDto[]>("/audit", { page_size: 30 });
    return data
      .filter((a) => NOTIFY_TYPES.has(a.event_type))
      .slice(0, 12)
      .map(auditToNotification);
  }
}
