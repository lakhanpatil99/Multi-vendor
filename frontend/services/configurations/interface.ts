import type {
  Configuration,
  ConnectionRequest,
  IngestionResult,
  PipelineStage,
  Vendor,
} from "@/types";

export interface UploadOptions {
  deviceId?: string;
  source?: "FILE_UPLOAD" | "SSH";
}

export interface AnalyzeJob {
  jobId: string;
  status: string;
}

export interface JobState {
  status: string;
  progress: number;
  stages: PipelineStage[];
  result: IngestionResult | null;
  error?: string | null;
}

/**
 * ConfigurationService contract.
 *
 * Phase 3 note: the Phase 1 `simulateIngestion` is replaced by real
 * upload/analyze/poll methods (documented in docs/phase-3-integration-map.md).
 * `runIngestion` orchestrates upload → analyze → poll and drives the existing
 * ProcessingPipeline from the backend job's real stages.
 */
export interface ConfigurationService {
  list(): Promise<Configuration[]>;
  get(id: string): Promise<Configuration | null>;
  getByDevice(deviceId: string): Promise<Configuration | null>;
  listVendors(): Promise<Vendor[]>;
  pipelineTemplate(): PipelineStage[];

  upload(file: File, opts?: UploadOptions): Promise<Configuration>;
  analyze(configId: string): Promise<AnalyzeJob>;
  getJob(jobId: string): Promise<JobState>;
  /** Upload + analyze + poll, emitting real backend stages via onStage. */
  runIngestion(
    file: File,
    onStage: (stages: PipelineStage[]) => void
  ): Promise<IngestionResult>;

  /** Live-device connection test (backend never opens a socket in Phase 2/3). */
  connectionTest(req: ConnectionRequest): Promise<{ ok: boolean; message: string }>;
}
