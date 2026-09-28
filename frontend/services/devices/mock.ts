import { MOCK_DEVICES } from "@/mock";
import { delay } from "@/lib/utils";
import type { Device } from "@/types";
import type { DeviceQuery, DeviceService } from "./interface";

export class MockDeviceService implements DeviceService {
  async list(query?: DeviceQuery): Promise<Device[]> {
    await delay(180);
    let items = [...MOCK_DEVICES];
    if (query?.vendorId && query.vendorId !== "all") {
      if (query.vendorId === "other") {
        items = items.filter(
          (d) => !["cisco", "juniper", "fortinet"].includes(d.vendorId)
        );
      } else {
        items = items.filter((d) => d.vendorId === query.vendorId);
      }
    }
    if (query?.status && query.status !== "all") {
      items = items.filter((d) => d.status === query.status);
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      items = items.filter(
        (d) =>
          d.hostname.toLowerCase().includes(q) ||
          d.ipAddress.includes(q) ||
          d.model.toLowerCase().includes(q)
      );
    }
    return items;
  }

  async get(id: string): Promise<Device | null> {
    await delay(120);
    return MOCK_DEVICES.find((d) => d.id === id) ?? null;
  }
}
