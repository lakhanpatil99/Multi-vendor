import { MOCK_FINDINGS, getFinding } from "@/mock";
import { delay } from "@/lib/utils";
import type { ComplianceFinding } from "@/types";
import type { FindingQuery, FindingService } from "./interface";

export class MockFindingService implements FindingService {
  async list(query?: FindingQuery): Promise<ComplianceFinding[]> {
    await delay(180);
    let items = [...MOCK_FINDINGS];
    if (query?.deviceId) items = items.filter((f) => f.deviceId === query.deviceId);
    if (query?.vendorId && query.vendorId !== "all")
      items = items.filter((f) => f.vendorId === query.vendorId);
    if (query?.category) items = items.filter((f) => f.category === query.category);
    if (query?.severity) items = items.filter((f) => f.severity === query.severity);
    if (query?.status && query.status !== "all")
      items = items.filter((f) => f.status === query.status);
    if (query?.search) {
      const q = query.search.toLowerCase();
      items = items.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.deviceHostname.toLowerCase().includes(q)
      );
    }
    return items;
  }

  async get(id: string): Promise<ComplianceFinding | null> {
    await delay(120);
    return getFinding(id) ?? null;
  }
}
