/**
 * Service registry — the single place where concrete service implementations
 * are bound. In Phase 1 every service is a Mock*Service. In Phase 3 these are
 * replaced with Api*Service implementations of the SAME interfaces, and no UI
 * or hook code needs to change.
 */
import { MockDeviceService } from "./devices/mock";
import { MockConfigurationService } from "./configurations/mock";
import { MockComplianceService } from "./compliance/mock";
import { MockFindingService } from "./findings/mock";
import { MockTrainingService } from "./training/mock";
import { MockRemediationService } from "./remediation/mock";
import { MockReportService } from "./reports/mock";
import { MockAuditService } from "./audit/mock";

import type { DeviceService } from "./devices/interface";
import type { ConfigurationService } from "./configurations/interface";
import type { ComplianceService } from "./compliance/interface";
import type { FindingService } from "./findings/interface";
import type { TrainingService } from "./training/interface";
import type { RemediationService } from "./remediation/interface";
import type { ReportService } from "./reports/interface";
import type { AuditService } from "./audit/interface";

export interface ServiceRegistry {
  devices: DeviceService;
  configurations: ConfigurationService;
  compliance: ComplianceService;
  findings: FindingService;
  training: TrainingService;
  remediation: RemediationService;
  reports: ReportService;
  audit: AuditService;
}

export const services: ServiceRegistry = {
  devices: new MockDeviceService(),
  configurations: new MockConfigurationService(),
  compliance: new MockComplianceService(),
  findings: new MockFindingService(),
  training: new MockTrainingService(),
  remediation: new MockRemediationService(),
  reports: new MockReportService(),
  audit: new MockAuditService(),
};

export type { DeviceService } from "./devices/interface";
export type { ConfigurationService } from "./configurations/interface";
export type { ComplianceService } from "./compliance/interface";
export type { FindingService } from "./findings/interface";
export type { TrainingService } from "./training/interface";
export type { RemediationService } from "./remediation/interface";
export type { ReportService } from "./reports/interface";
export type { AuditService } from "./audit/interface";
