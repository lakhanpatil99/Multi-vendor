"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Readable, collapsible JSON/tree viewer for the normalized model. */
export function JsonViewer({
  data,
  className,
  rootLabel = "normalized",
}: {
  data: unknown;
  className?: string;
  rootLabel?: string;
}) {
  return (
    <div
      className={cn(
        "config-surface overflow-auto rounded-lg border border-border bg-[hsl(222_47%_5%)] p-3",
        className
      )}
    >
      <Node label={rootLabel} value={data} depth={0} defaultOpen />
    </div>
  );
}

function Node({
  label,
  value,
  depth,
  defaultOpen = false,
}: {
  label: string;
  value: unknown;
  depth: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen || depth < 2);
  const isObject = value !== null && typeof value === "object";

  if (!isObject) {
    return (
      <div className="flex gap-2 py-0.5" style={{ paddingLeft: depth * 14 }}>
        <span className="text-primary/80">{label}:</span>
        <span className={valueClass(value)}>{formatPrimitive(value)}</span>
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  return (
    <div style={{ paddingLeft: depth * 14 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 py-0.5 text-left hover:text-foreground"
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform",
            open && "rotate-90"
          )}
        />
        <span className="text-primary/80">{label}</span>
        <span className="text-muted-foreground/60">
          {Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </button>
      {open && (
        <div className="border-l border-border/40">
          {entries.map(([k, v]) => (
            <Node key={k} label={k} value={v} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatPrimitive(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

function valueClass(value: unknown): string {
  if (typeof value === "boolean")
    return value ? "text-success" : "text-critical";
  if (typeof value === "number") return "text-medium";
  return "text-foreground/80";
}
