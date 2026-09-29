import { api } from "@/lib/api/client";
import { toFinding } from "@/lib/api/adapters";
import { deviceLookup } from "@/lib/api/device-lookup";
import type { FindingDto } from "@/lib/api/dto";
import type { ComplianceFinding } from "@/types";
import type { FindingQuery, FindingService } from "./interface";

export class ApiFindingService implements FindingService {
  async list(query?: FindingQuery): Promise<ComplianceFinding[]> {
    const q: Record<string, string | number | undefined> = { page_size: 100 };
    if (query?.severity) q.severity = query.severity;
    if (query?.category) q.category = query.category;
    if (query?.deviceId) q.device_id = query.deviceId;

    const [{ data }, devices] = await Promise.all([
      api.getPaged<FindingDto[]>("/findings", q),
      deviceLookup(),
    ]);
    let findings = data.map((f) => toFinding(f, devices[f.device_id]));

    // The frontend "status" filter is the PASS/FAIL result (adapter maps
    // backend `result` → frontend `status`). Backend `status` is the lifecycle
    // column, so we filter by result client-side to avoid a semantic mismatch.
    if (query?.status && query.status !== "all") {
      findings = findings.filter((f) => f.status === query.status);
    }
    // Vendor + free-text filters (not covered by backend finding list).
    if (query?.vendorId && query.vendorId !== "all") {
      findings = findings.filter((f) => f.vendorId === query.vendorId);
    }
    if (query?.search) {
      const s = query.search.toLowerCase();
      findings = findings.filter(
        (f) =>
          f.title.toLowerCase().includes(s) ||
          f.deviceHostname.toLowerCase().includes(s)
      );
    }
    return findings;
  }

  async get(id: string): Promise<ComplianceFinding | null> {
    try {
      const [f, devices] = await Promise.all([
        api.get<FindingDto>(`/findings/${id}`),
        deviceLookup(),
      ]);
      const finding = toFinding(f, devices[f.device_id]);
      // Link remediation if one exists for this finding.
      try {
        const rems = await api.getPaged<{ id: string; finding_id: string }[]>(
          "/remediation",
          { page_size: 100 }
        );
        const match = rems.data.find((r) => r.finding_id === id);
        if (match) finding.remediationId = match.id;
      } catch {
        /* remediation lookup is best-effort */
      }
      return finding;
    } catch (err) {
      if ((err as { status?: number })?.status === 404) return null;
      throw err;
    }
  }
}
