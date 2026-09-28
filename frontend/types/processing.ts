/** Ingestion pipeline stage descriptor for the upload/processing UX. */
export type PipelineStageStatus =
  | "PENDING"
  | "ACTIVE"
  | "COMPLETE"
  | "FAILED"
  | "NEEDS_REVIEW";

export interface PipelineStage {
  id: string;
  label: string;
  description: string;
  status: PipelineStageStatus;
  /** Optional detail line shown when active/complete. */
  detail?: string;
}

/** Result payload from a simulated upload+analysis run. */
export interface IngestionResult {
  configurationId: string;
  deviceId: string;
  vendorName: string;
  os: string;
  findingsCreated: number;
  unknownPatterns: number;
  complianceScore: number;
}

/** Live connection form model (Phase 1 simulated — no real credentials stored). */
export interface ConnectionRequest {
  method: "SSH";
  vendorId: string;
  hostname: string;
  username: string;
  credentialReference: string;
  port: number;
}
