import type {
  Configuration,
  ConnectionRequest,
  IngestionResult,
  PipelineStage,
  Vendor,
} from "@/types";

export interface ConfigurationService {
  list(): Promise<Configuration[]>;
  get(id: string): Promise<Configuration | null>;
  getByDevice(deviceId: string): Promise<Configuration | null>;
  listVendors(): Promise<Vendor[]>;
  /** The ordered ingestion pipeline (simulated). */
  pipelineTemplate(): PipelineStage[];
  /**
   * Simulate an upload + analysis run. Emits stage updates via onStage and
   * resolves with a summary result. NO real parsing occurs in Phase 1.
   */
  simulateIngestion(
    fileName: string,
    onStage: (stages: PipelineStage[]) => void
  ): Promise<IngestionResult>;
  /** Simulate a live-device connection test (never opens a socket). */
  simulateConnectionTest(req: ConnectionRequest): Promise<{
    ok: boolean;
    message: string;
  }>;
}
