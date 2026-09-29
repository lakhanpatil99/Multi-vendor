import { api } from "@/lib/api/client";
import { toConfiguration } from "@/lib/api/adapters";
import type {
  ConfigurationDto,
  DeviceDto,
  JobDto,
  NormalizedModelDto,
} from "@/lib/api/dto";
import { MOCK_VENDORS } from "@/mock/vendors";
import type {
  Configuration,
  ConnectionRequest,
  IngestionResult,
  PipelineStage,
  Vendor,
} from "@/types";
import type {
  AnalyzeJob,
  ConfigurationService,
  JobState,
  UploadOptions,
} from "./interface";

const PIPELINE_TEMPLATE: PipelineStage[] = [
  { id: "validate", label: "Validate", description: "Verify format and size", status: "PENDING" },
  { id: "detect_vendor", label: "Detect Vendor", description: "Identify device vendor", status: "PENDING" },
  { id: "detect_os", label: "Detect OS", description: "Identify operating system", status: "PENDING" },
  { id: "parse", label: "Parse", description: "Vendor-aware parsing", status: "PENDING" },
  { id: "normalize", label: "Normalize", description: "Build vendor-neutral model", status: "PENDING" },
  { id: "detect_unknown", label: "Unknown Pattern Detection", description: "Known vs unknown", status: "PENDING" },
  { id: "ai_analysis", label: "AI Analysis", description: "Similarity suggestions", status: "PENDING" },
  { id: "compliance", label: "Compliance Check", description: "Evaluate frameworks", status: "PENDING" },
  { id: "findings", label: "Generate Findings", description: "Evidence-backed findings", status: "PENDING" },
  { id: "remediation", label: "Remediation", description: "Vendor-specific fixes", status: "PENDING" },
  { id: "persist", label: "Persist Results", description: "Store results", status: "PENDING" },
];

function mapStages(job: JobDto): PipelineStage[] {
  return job.stages.map((s) => ({
    id: s.id,
    label: s.label,
    description: "",
    status: (s.status as PipelineStage["status"]) ?? "PENDING",
    detail: s.detail,
  }));
}

function mapResult(job: JobDto): IngestionResult | null {
  const r = job.result || {};
  if (!r.configuration_id) return null;
  return {
    configurationId: String(r.configuration_id),
    deviceId: String(r.device_id ?? ""),
    vendorName: String(r.vendor ?? ""),
    os: String(r.os ?? ""),
    findingsCreated: Number(r.findings_created ?? 0),
    unknownPatterns: Number(r.unknown_patterns ?? 0),
    complianceScore: Number(r.compliance_score ?? 0),
  };
}

export class ApiConfigurationService implements ConfigurationService {
  async list(): Promise<Configuration[]> {
    const { data } = await api.getPaged<ConfigurationDto[]>("/configurations", {
      page_size: 100,
    });
    const hosts = await this._deviceHosts();
    return data.map((c) =>
      toConfiguration(c, { deviceHostname: c.device_id ? hosts[c.device_id] : "" })
    );
  }

  async get(id: string): Promise<Configuration | null> {
    const c = await api.get<ConfigurationDto>(`/configurations/${id}`);
    let normalized: NormalizedModelDto | null = null;
    try {
      normalized = await api.get<NormalizedModelDto>(`/normalization/${id}`);
    } catch {
      normalized = null; // not analyzed yet
    }
    const hosts = await this._deviceHosts();
    return toConfiguration(c, {
      deviceHostname: c.device_id ? hosts[c.device_id] : "",
      normalized,
    });
  }

  async getByDevice(deviceId: string): Promise<Configuration | null> {
    const { data } = await api.getPaged<ConfigurationDto[]>("/configurations", {
      page_size: 100,
    });
    const match = data.find((c) => c.device_id === deviceId);
    if (!match) return null;
    return this.get(match.id);
  }

  async listVendors(): Promise<Vendor[]> {
    // Static vendor display metadata (presentation reference, not API data).
    return MOCK_VENDORS;
  }

  pipelineTemplate(): PipelineStage[] {
    return PIPELINE_TEMPLATE.map((s) => ({ ...s }));
  }

  async upload(file: File, opts?: UploadOptions): Promise<Configuration> {
    const form = new FormData();
    form.append("file", file);
    if (opts?.deviceId) form.append("device_id", opts.deviceId);
    form.append("source", opts?.source ?? "FILE_UPLOAD");
    const c = await api.upload<ConfigurationDto>("/configurations/upload", form);
    return toConfiguration(c);
  }

  async analyze(configId: string): Promise<AnalyzeJob> {
    const res = await api.post<{ job_id: string; status: string }>(
      `/configurations/${configId}/analyze`
    );
    return { jobId: res.job_id, status: res.status };
  }

  async getJob(jobId: string): Promise<JobState> {
    const job = await api.get<JobDto>(`/analysis/${jobId}`);
    return {
      status: job.status,
      progress: job.progress,
      stages: mapStages(job),
      result: mapResult(job),
      error: job.error,
    };
  }

  async runIngestion(
    file: File,
    onStage: (stages: PipelineStage[]) => void
  ): Promise<IngestionResult> {
    const config = await this.upload(file);
    const { jobId } = await this.analyze(config.id);

    // Poll the real job until terminal. Reflect real backend stages/progress.
    const terminal = new Set(["COMPLETED", "FAILED", "CANCELLED"]);
    let state = await this.getJob(jobId);
    onStage(state.stages);
    let guard = 0;
    while (!terminal.has(state.status) && guard < 150) {
      await new Promise((r) => setTimeout(r, 500));
      state = await this.getJob(jobId);
      onStage(state.stages);
      guard += 1;
    }
    if (state.status === "FAILED") {
      throw new Error(state.error || "Analysis failed");
    }
    return (
      state.result ?? {
        configurationId: config.id,
        deviceId: config.deviceId,
        vendorName: config.vendorName,
        os: config.os,
        findingsCreated: 0,
        unknownPatterns: 0,
        complianceScore: 0,
      }
    );
  }

  async connectionTest(
    req: ConnectionRequest
  ): Promise<{ ok: boolean; message: string }> {
    return api.post<{ ok: boolean; message: string }>(
      "/configurations/connect/test",
      {
        vendor: req.vendorId,
        hostname: req.hostname,
        username: req.username,
        credential_reference: req.credentialReference,
        port: req.port,
      }
    );
  }

  private _hostCache: Record<string, string> | null = null;
  private async _deviceHosts(): Promise<Record<string, string>> {
    if (this._hostCache) return this._hostCache;
    const { data } = await api.getPaged<DeviceDto[]>("/devices", { page_size: 100 });
    this._hostCache = Object.fromEntries(data.map((d) => [d.id, d.hostname]));
    return this._hostCache;
  }
}
