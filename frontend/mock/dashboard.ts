import type { RiskDistribution } from "@/types";

/** Dashboard top-line metrics. */
export const MOCK_DASHBOARD_METRICS = {
  devicesAnalyzed: 6,
  configurationsProcessed: 9,
  overallCompliance: 69,
  criticalFindings: 5,
  highFindings: 11,
  unknownPatterns: 12,
};

export const MOCK_RISK_DISTRIBUTION: RiskDistribution[] = [
  { severity: "CRITICAL", count: 5 },
  { severity: "HIGH", count: 11 },
  { severity: "MEDIUM", count: 14 },
  { severity: "LOW", count: 9 },
  { severity: "INFO", count: 2 },
];

/** Vendor distribution for the dashboard pie/bar. */
export const MOCK_VENDOR_DISTRIBUTION = [
  { vendor: "Cisco", devices: 2, hex: "#049fd9" },
  { vendor: "Juniper", devices: 2, hex: "#84b135" },
  { vendor: "Fortinet", devices: 2, hex: "#ee3124" },
];
