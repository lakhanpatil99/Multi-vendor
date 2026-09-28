import type {
  ControlCategory,
  DetectionOrigin,
  FindingStatus,
  FrameworkId,
  Severity,
} from "./enums";

/** Compliance framework metadata. */
export interface ComplianceFramework {
  id: FrameworkId;
  name: string; // "CIS Benchmarks"
  shortName: string; // "CIS"
  version: string;
  description: string;
  /** Aggregate score 0-100 across all evaluated controls. */
  score: number;
  controlsTotal: number;
  controlsPass: number;
  controlsFail: number;
  controlsNa: number;
  controlsUnknown: number;
}

/**
 * A framework control reference. One canonical finding maps to many of these.
 */
export interface FrameworkMapping {
  frameworkId: FrameworkId;
  frameworkName: string;
  /** Control identifier (mocked in Phase 1 — not a verified compliance claim). */
  controlId: string;
  controlTitle: string;
  /** Optional deep-link description. */
  rationale?: string;
}

/**
 * A deterministic (or AI-assisted) compliance rule definition. Rules produce
 * findings when evaluated against normalized facts.
 */
export interface ComplianceRule {
  id: string; // RULE-xxxx
  title: string;
  category: ControlCategory;
  severity: Severity;
  description: string;
  origin: DetectionOrigin;
  /** Normalized field this rule inspects. */
  field: string;
  expectedValue: string;
  /** Frameworks this rule contributes to. */
  frameworks: FrameworkMapping[];
}

/** Per-category compliance rollup. */
export interface CategoryCompliance {
  category: ControlCategory;
  label: string;
  score: number;
  pass: number;
  fail: number;
  na: number;
  unknown: number;
}

/** Compliance overview aggregate for the compliance center + dashboard. */
export interface ComplianceOverview {
  overallScore: number;
  statusBreakdown: {
    pass: number;
    fail: number;
    na: number;
    unknown: number;
  };
  frameworks: ComplianceFramework[];
  categories: CategoryCompliance[];
  /** Trend points for the compliance-over-time chart. */
  trend: { date: string; score: number }[];
}

/** Severity distribution used by risk charts. */
export interface RiskDistribution {
  severity: Severity;
  count: number;
}

/** Finding grouping for dashboards. */
export interface FindingStatusCounts {
  pass: number;
  fail: number;
  na: number;
  unknown: number;
}
