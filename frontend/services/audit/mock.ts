import { MOCK_AUDIT_EVENTS, MOCK_NOTIFICATIONS } from "@/mock";
import { delay } from "@/lib/utils";
import type { AppNotification, AuditEvent } from "@/types";
import type { AuditService } from "./interface";

export class MockAuditService implements AuditService {
  async events(): Promise<AuditEvent[]> {
    await delay(160);
    return [...MOCK_AUDIT_EVENTS].sort(
      (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)
    );
  }

  async notifications(): Promise<AppNotification[]> {
    await delay(100);
    return [...MOCK_NOTIFICATIONS].sort(
      (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)
    );
  }
}
