import type { AuditEventType, NotificationKind, Severity } from "./enums";

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  title: string;
  description: string;
  actor: string;
  /** Related entity references for drill-down. */
  deviceId?: string;
  configurationId?: string;
  findingId?: string;
  reportId?: string;
  patternId?: string;
  severity?: Severity;
  timestamp: string; // ISO
}

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  read: boolean;
  timestamp: string; // ISO
  /** Optional in-app route to navigate to. */
  href?: string;
}
