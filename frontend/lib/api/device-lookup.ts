import { api } from "@/lib/api/client";
import type { DeviceDto } from "./dto";
import type { DeviceLite } from "./adapters";

/** Fetch a device-id → lite-info map for enriching findings/remediations
 * (backend finding/remediation DTOs carry device_id but not hostname/vendor). */
export async function deviceLookup(): Promise<Record<string, DeviceLite>> {
  const { data } = await api.getPaged<DeviceDto[]>("/devices", { page_size: 100 });
  return Object.fromEntries(
    data.map((d) => [
      d.id,
      { hostname: d.hostname, vendor: d.vendor, os: d.os_name ?? "" },
    ])
  );
}
