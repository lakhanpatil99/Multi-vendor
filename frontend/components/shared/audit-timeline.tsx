import {
  FileUp,
  Plug,
  ScanSearch,
  FileCog,
  Sparkles,
  HelpCircle,
  GraduationCap,
  ShieldCheck,
  AlertCircle,
  FileBarChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { SeverityBadge } from "./badges";
import type { AuditEvent, AuditEventType } from "@/types";

const EVENT_ICON: Record<AuditEventType, LucideIcon> = {
  CONFIGURATION_UPLOADED: FileUp,
  DEVICE_CONNECTED: Plug,
  VENDOR_DETECTED: ScanSearch,
  CONFIGURATION_PARSED: FileCog,
  AI_ANALYSIS_COMPLETED: Sparkles,
  UNKNOWN_PATTERN_CREATED: HelpCircle,
  TRAINING_APPROVED: GraduationCap,
  COMPLIANCE_SCAN_COMPLETED: ShieldCheck,
  FINDING_CREATED: AlertCircle,
  REPORT_GENERATED: FileBarChart,
};

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
    <ol className="relative space-y-0">
      {events.map((e, i) => {
        const Icon = EVENT_ICON[e.type];
        const isLast = i === events.length - 1;
        return (
          <li key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-overlay text-primary">
                <Icon className="h-4 w-4" />
              </span>
              {!isLast && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className="flex-1 pb-5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{e.title}</p>
                {e.severity && <SeverityBadge severity={e.severity} />}
              </div>
              <p className="text-sm text-muted-foreground">{e.description}</p>
              <p className="mt-0.5 text-xs text-muted-foreground/70">
                {e.actor} · {formatDateTime(e.timestamp)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
