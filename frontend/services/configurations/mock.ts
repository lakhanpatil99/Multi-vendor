import {
  MOCK_CONFIGURATIONS,
  MOCK_VENDORS,
  getConfiguration,
  getConfigurationByDevice,
} from "@/mock";
import { delay } from "@/lib/utils";
import type {
  Configuration,
  ConnectionRequest,
  IngestionResult,
  PipelineStage,
  Vendor,
} from "@/types";
import type { ConfigurationService } from "./interface";

const STAGE_TEMPLATE: Omit<PipelineStage, "status">[] = [
  { id: "select", label: "Select File", description: "Read configuration file" },
  { id: "validate", label: "Validate", description: "Verify format and size" },
  { id: "vendor", label: "Detect Vendor", description: "Identify device vendor" },
  { id: "os", label: "Detect OS", description: "Identify operating system" },
  { id: "parse", label: "Parse", description: "Vendor-aware parsing" },
  { id: "normalize", label: "Normalize", description: "Build vendor-neutral model" },
  { id: "analyze", label: "Analyze", description: "Known vs unknown pattern detection" },
  { id: "compliance", label: "Compliance Check", description: "Evaluate against frameworks" },
  { id: "findings", label: "Generate Findings", description: "Produce evidence-backed findings" },
];

export class MockConfigurationService implements ConfigurationService {
  async list(): Promise<Configuration[]> {
    await delay(160);
    return [...MOCK_CONFIGURATIONS];
  }

  async get(id: string): Promise<Configuration | null> {
    await delay(120);
    return getConfiguration(id) ?? null;
  }

  async getByDevice(deviceId: string): Promise<Configuration | null> {
    await delay(120);
    return getConfigurationByDevice(deviceId) ?? null;
  }

  async listVendors(): Promise<Vendor[]> {
    await delay(80);
    return [...MOCK_VENDORS];
  }

  pipelineTemplate(): PipelineStage[] {
    return STAGE_TEMPLATE.map((s) => ({ ...s, status: "PENDING" }));
  }

  async simulateIngestion(
    fileName: string,
    onStage: (stages: PipelineStage[]) => void
  ): Promise<IngestionResult> {
    const stages = this.pipelineTemplate();
    const details: Record<string, string> = {
      select: fileName,
      validate: "Format OK · 1.3 KB",
      vendor: "Cisco (99% confidence)",
      os: "IOS 15.7(3)M",
      parse: "48 lines · 9 facts",
      normalize: "Vendor-neutral model built",
      analyze: "0 unknown patterns",
      compliance: "CIS · NIST · STIG · ISO",
      findings: "9 findings created",
    };

    for (let i = 0; i < stages.length; i++) {
      stages[i].status = "ACTIVE";
      onStage(stages.map((s) => ({ ...s })));
      await delay(520);
      stages[i].status = "COMPLETE";
      stages[i].detail = details[stages[i].id];
      onStage(stages.map((s) => ({ ...s })));
    }

    return {
      configurationId: "cfg-core-rtr-01",
      deviceId: "dev-core-rtr-01",
      vendorName: "Cisco",
      os: "IOS",
      findingsCreated: 9,
      unknownPatterns: 0,
      complianceScore: 58,
    };
  }

  async simulateConnectionTest(
    req: ConnectionRequest
  ): Promise<{ ok: boolean; message: string }> {
    await delay(900);
    // Phase 1: never opens a socket. Returns a simulated, prototype response.
    if (!req.hostname || !req.username) {
      return { ok: false, message: "Hostname and username are required." };
    }
    return {
      ok: true,
      message:
        "Prototype simulation only — no live connection was established. Backend SSH/Netmiko integration is pending (Phase 4).",
    };
  }
}
