/**
 * Service registry — bound to the real API implementations (Phase 3).
 *
 * Every service talks to FastAPI via lib/api/client.ts. There is no mock
 * fallback: API failures surface as errors so integration issues are visible.
 * The UI/hook layer is unchanged — it depends only on the service interfaces.
 */
import { ApiDeviceService } from "./devices/api";
import { ApiConfigurationService } from "./configurations/api";
import { ApiComplianceService } from "./compliance/api";
import { ApiFindingService } from "./findings/api";
import { ApiTrainingService } from "./training/api";
import { ApiRemediationService } from "./remediation/api";
import { ApiReportService } from "./reports/api";
import { ApiAuditService } from "./audit/api";

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
  devices: new ApiDeviceService(),
  configurations: new ApiConfigurationService(),
  compliance: new ApiComplianceService(),
  findings: new ApiFindingService(),
  training: new ApiTrainingService(),
  remediation: new ApiRemediationService(),
  reports: new ApiReportService(),
  audit: new ApiAuditService(),
};

export type { DeviceService } from "./devices/interface";
export type { ConfigurationService } from "./configurations/interface";
export type { ComplianceService } from "./compliance/interface";
export type { FindingService } from "./findings/interface";
export type { TrainingService } from "./training/interface";
export type { RemediationService } from "./remediation/interface";
export type { ReportService } from "./reports/interface";
export type { AuditService } from "./audit/interface";
