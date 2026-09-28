"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

/** Human labels for known path segments. */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  devices: "Devices",
  configurations: "Configurations",
  upload: "Upload",
  compliance: "Compliance",
  frameworks: "Framework Mapping",
  findings: "Findings",
  "ai-analysis": "AI Analysis",
  training: "Training Center",
  patterns: "Learned Patterns",
  remediation: "Remediation",
  reports: "Reports",
  audit: "Audit Logs",
  settings: "Settings",
};

function labelFor(segment: string) {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  // IDs -> shorten
  return segment.length > 16 ? segment.slice(0, 14) + "…" : segment;
}

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground">
        ANCP
      </Link>
      {segments.map((seg, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            {isLast ? (
              <span className="font-medium text-foreground">{labelFor(seg)}</span>
            ) : (
              <Link href={href} className="hover:text-foreground">
                {labelFor(seg)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
