import type {
  ControlCategory,
  DetectionOrigin,
  FrameworkId,
  PatternStatus,
} from "@/types";

/** Product identity. */
export const PRODUCT = {
  name: "AI Network Compliance Platform",
  shortName: "ANCP",
  tagline:
    "AI-driven multi-vendor network security compliance auditing and hardening platform.",
};

/** Control category display labels + accent hex for charts. */
export const CONTROL_CATEGORY_META: Record<
  ControlCategory,
  { label: string; short: string; hex: string }
> = {
  AUTHENTICATION: { label: "Authentication", short: "Auth", hex: "#1ba3ec" },
  SSH: { label: "SSH", short: "SSH", hex: "#2bb673" },
  TELNET: { label: "Telnet", short: "Telnet", hex: "#e5484d" },
  LOGGING: { label: "Logging", short: "Logging", hex: "#8b5cf6" },
  ACL_FIREWALL: { label: "ACL / Firewall", short: "ACL", hex: "#f2680c" },
  NTP: { label: "NTP", short: "NTP", hex: "#06b6d4" },
  SNMP: { label: "SNMP", short: "SNMP", hex: "#f5a524" },
  ENCRYPTION: { label: "Encryption", short: "Crypto", hex: "#22d3ee" },
  MANAGEMENT_ACCESS: {
    label: "Management Access",
    short: "Mgmt",
    hex: "#ec4899",
  },
  PASSWORD_SECURITY: {
    label: "Password Security",
    short: "Password",
    hex: "#a3e635",
  },
  SESSION_MANAGEMENT: {
    label: "Session Management",
    short: "Session",
    hex: "#818cf8",
  },
  ACCESS_CONTROL: { label: "Access Control", short: "Access", hex: "#fb7185" },
};

export const CONTROL_CATEGORIES = Object.keys(
  CONTROL_CATEGORY_META
) as ControlCategory[];

/** Framework display metadata + accent. */
export const FRAMEWORK_META: Record<
  FrameworkId,
  { name: string; short: string; hex: string }
> = {
  CIS: { name: "CIS Benchmarks", short: "CIS", hex: "#1ba3ec" },
  NIST: { name: "NIST SP 800-53", short: "NIST", hex: "#2bb673" },
  STIG: { name: "DISA STIG", short: "STIG", hex: "#f5a524" },
  ISO: { name: "ISO/IEC 27001", short: "ISO", hex: "#8b5cf6" },
};

export const DETECTION_ORIGIN_META: Record<
  DetectionOrigin,
  { label: string; description: string }
> = {
  DETERMINISTIC: {
    label: "Deterministic",
    description: "Matched by a known parser rule with high certainty.",
  },
  AI_ASSISTED: {
    label: "AI-Assisted",
    description:
      "Interpreted via similarity analysis — subject to human review.",
  },
};

export const PATTERN_STATUS_META: Record<
  PatternStatus,
  { label: string; text: string; bg: string }
> = {
  UNKNOWN: {
    label: "Unknown",
    text: "text-medium",
    bg: "bg-medium/10",
  },
  AI_SUGGESTED: {
    label: "AI Suggested",
    text: "text-primary",
    bg: "bg-primary/10",
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    text: "text-high",
    bg: "bg-high/10",
  },
  LEARNED: {
    label: "Learned",
    text: "text-success",
    bg: "bg-success/10",
  },
  REJECTED: {
    label: "Rejected",
    text: "text-muted-foreground",
    bg: "bg-muted/40",
  },
};
