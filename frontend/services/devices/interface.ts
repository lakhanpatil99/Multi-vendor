import type { Device } from "@/types";

export interface DeviceQuery {
  vendorId?: string;
  status?: string;
  search?: string;
}

/**
 * DeviceService contract. Phase 1 is backed by MockDeviceService; Phase 3
 * swaps in ApiDeviceService against the same interface — the UI is unchanged.
 */
export interface DeviceService {
  list(query?: DeviceQuery): Promise<Device[]>;
  get(id: string): Promise<Device | null>;
}
