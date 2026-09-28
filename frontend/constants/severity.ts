import type { FindingStatus, RiskLevel, Severity } from "@/types";

/**
 * Presentation tokens for severity, status, and risk. Centralized so badges,
 * charts, and cards stay consistent across every module.
 * `dot`/`text`/`bg`/`border` are Tailwind classes bound to design tokens.
 */
export interface ToneToken {
  label: string;
  text: string;
  bg: string;
  border: string;
  dot: string;
  /** Hex for Recharts (charts can't read CSS var classes directly). */
  hex: string;
}

export const SEVERITY_TOKENS: Record<Severity, ToneToken> = {
  CRITICAL: {
    label: "Critical",
    text: "text-critical",
    bg: "bg-critical/10",
    border: "border-critical/30",
    dot: "bg-critical",
    hex: "#e5484d",
  },
  HIGH: {
    label: "High",
    text: "text-high",
    bg: "bg-high/10",
    border: "border-high/30",
    dot: "bg-high",
    hex: "#f2680c",
  },
  MEDIUM: {
    label: "Medium",
    text: "text-medium",
    bg: "bg-medium/10",
    border: "border-medium/30",
    dot: "bg-medium",
    hex: "#f5a524",
  },
  LOW: {
    label: "Low",
    text: "text-low",
    bg: "bg-low/10",
    border: "border-low/30",
    dot: "bg-low",
    hex: "#1ba3ec",
  },
  INFO: {
    label: "Info",
    text: "text-muted-foreground",
    bg: "bg-muted/40",
    border: "border-border",
    dot: "bg-muted-foreground",
    hex: "#8b97a7",
  },
};

export const STATUS_TOKENS: Record<FindingStatus, ToneToken> = {
  PASS: {
    label: "Pass",
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    dot: "bg-success",
    hex: "#2bb673",
  },
  FAIL: {
    label: "Fail",
    text: "text-critical",
    bg: "bg-critical/10",
    border: "border-critical/30",
    dot: "bg-critical",
    hex: "#e5484d",
  },
  "N/A": {
    label: "N/A",
    text: "text-muted-foreground",
    bg: "bg-muted/40",
    border: "border-border",
    dot: "bg-muted-foreground",
    hex: "#8b97a7",
  },
  UNKNOWN: {
    label: "Unknown",
    text: "text-medium",
    bg: "bg-medium/10",
    border: "border-medium/30",
    dot: "bg-medium",
    hex: "#f5a524",
  },
};

export const RISK_TOKENS: Record<RiskLevel, ToneToken> = {
  CRITICAL: SEVERITY_TOKENS.CRITICAL,
  HIGH: SEVERITY_TOKENS.HIGH,
  MEDIUM: SEVERITY_TOKENS.MEDIUM,
  LOW: SEVERITY_TOKENS.LOW,
  MINIMAL: {
    label: "Minimal",
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    dot: "bg-success",
    hex: "#2bb673",
  },
};

export const SEVERITY_ORDER: Severity[] = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "INFO",
];

/** Score -> tone helper for compliance rings/bars. */
export function scoreTone(score: number): ToneToken {
  if (score >= 90) return STATUS_TOKENS.PASS;
  if (score >= 75) return SEVERITY_TOKENS.LOW;
  if (score >= 50) return SEVERITY_TOKENS.MEDIUM;
  return SEVERITY_TOKENS.CRITICAL;
}
