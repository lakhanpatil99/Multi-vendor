"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  FileBarChart,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { services } from "@/services";
import type { AppNotification, NotificationKind } from "@/types";

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  CRITICAL_FINDING: ShieldAlert,
  ANALYSIS_COMPLETE: CheckCircle2,
  PATTERN_REVIEW: Sparkles,
  TRAINING_APPROVED: GraduationCap,
  REPORT_GENERATED: FileBarChart,
  ANALYSIS_FAILED: XCircle,
};

const KIND_TONE: Record<NotificationKind, string> = {
  CRITICAL_FINDING: "text-critical",
  ANALYSIS_COMPLETE: "text-success",
  PATTERN_REVIEW: "text-primary",
  TRAINING_APPROVED: "text-success",
  REPORT_GENERATED: "text-primary",
  ANALYSIS_FAILED: "text-critical",
};

export function Notifications() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    try {
      setItems(await services.audit.notifications());
    } catch {
      setItems([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!loaded) load();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border bg-surface-overlay shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-medium">Notifications</p>
            <span className="text-xs text-muted-foreground">{unread} unread</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                {loaded ? "No recent activity." : "Loading…"}
              </p>
            )}
            {items.map((n) => {
              const Icon = KIND_ICON[n.kind];
              return (
                <Link
                  key={n.id}
                  href={n.href ?? "#"}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex gap-3 border-b border-border/50 px-4 py-3 hover:bg-primary/5",
                    !n.read && "bg-primary/[0.04]"
                  )}
                >
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", KIND_TONE[n.kind])} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                      {timeAgo(n.timestamp)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
