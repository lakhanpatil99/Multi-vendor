import { api } from "@/lib/api/client";
import { toDevice } from "@/lib/api/adapters";
import type { DeviceDto } from "@/lib/api/dto";
import type { Device } from "@/types";
import type { DeviceQuery, DeviceService } from "./interface";

const KNOWN = new Set(["cisco", "juniper", "fortinet"]);

export class ApiDeviceService implements DeviceService {
  async list(query?: DeviceQuery): Promise<Device[]> {
    const q: Record<string, string | number | undefined> = { page_size: 100 };
    if (query?.status && query.status !== "all") q.status = query.status;
    if (query?.vendorId && KNOWN.has(query.vendorId)) q.vendor = query.vendorId;

    const { data } = await api.getPaged<DeviceDto[]>("/devices", q);
    let devices = data.map(toDevice);

    // Filters the backend list endpoint doesn't cover.
    if (query?.vendorId === "other") {
      devices = devices.filter((d) => !KNOWN.has(d.vendorId));
    }
    if (query?.search) {
      const s = query.search.toLowerCase();
      devices = devices.filter(
        (d) =>
          d.hostname.toLowerCase().includes(s) ||
          d.ipAddress.includes(s) ||
          d.model.toLowerCase().includes(s)
      );
    }
    return devices;
  }

  async get(id: string): Promise<Device | null> {
    try {
      const d = await api.get<DeviceDto>(`/devices/${id}`);
      return toDevice(d);
    } catch (err) {
      if ((err as { status?: number })?.status === 404) return null;
      throw err;
    }
  }
}
