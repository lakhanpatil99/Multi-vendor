import { api } from "@/lib/api/client";
import { toRemediation } from "@/lib/api/adapters";
import { deviceLookup } from "@/lib/api/device-lookup";
import type { RemediationDto } from "@/lib/api/dto";
import type { Remediation } from "@/types";
import type { RemediationService } from "./interface";

export class ApiRemediationService implements RemediationService {
  async list(): Promise<Remediation[]> {
    const [{ data }, devices] = await Promise.all([
      api.getPaged<RemediationDto[]>("/remediation", { page_size: 100 }),
      deviceLookup(),
    ]);
    return data.map((r) => toRemediation(r, devices[r.device_id]));
  }

  async get(id: string): Promise<Remediation | null> {
    try {
      const [r, devices] = await Promise.all([
        api.get<RemediationDto>(`/remediation/${id}`),
        deviceLookup(),
      ]);
      return toRemediation(r, devices[r.device_id]);
    } catch (err) {
      if ((err as { status?: number })?.status === 404) return null;
      throw err;
    }
  }

  async getByFinding(findingId: string): Promise<Remediation | null> {
    const [{ data }, devices] = await Promise.all([
      api.getPaged<RemediationDto[]>("/remediation", { page_size: 100 }),
      deviceLookup(),
    ]);
    const match = data.find((r) => r.finding_id === findingId);
    return match ? toRemediation(match, devices[match.device_id]) : null;
  }

  async decide(
    id: string,
    decision: "APPROVED" | "REJECTED"
  ): Promise<Remediation> {
    // Approval is recorded on the backend; NO command is ever executed.
    const r = await api.post<RemediationDto>(`/remediation/${id}/decision`, {
      decision,
    });
    const devices = await deviceLookup();
    return toRemediation(r, devices[r.device_id]);
  }
}
