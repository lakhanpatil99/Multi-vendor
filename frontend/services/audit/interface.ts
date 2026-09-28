import type { AppNotification, AuditEvent } from "@/types";

export interface AuditService {
  events(): Promise<AuditEvent[]>;
  notifications(): Promise<AppNotification[]>;
}
