import type {
  ConfigurationSource,
  DeviceStatus,
  DeviceType,
  RiskLevel,
} from "./enums";

export interface Device {
  id: string;
  hostname: string;
  vendorId: string;
  vendorName: string;
  deviceType: DeviceType;
  model: string;
  os: string;
  osVersion: string;
  serialNumber: string;
  ipAddress: string;
  source: ConfigurationSource;
  /** Overall compliance score 0-100. */
  complianceScore: number;
  riskLevel: RiskLevel;
  status: DeviceStatus;
  /** Count of findings by status for quick summaries. */
  findingsSummary: {
    pass: number;
    fail: number;
    na: number;
    unknown: number;
  };
  criticalFindings: number;
  highFindings: number;
  lastAnalysis: string; // ISO
  createdAt: string; // ISO
  location?: string;
  tags?: string[];
}
