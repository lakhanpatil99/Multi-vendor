import { api } from "@/lib/api/client";
import { toReport } from "@/lib/api/adapters";
import type { ReportDto } from "@/lib/api/dto";
import type { Report } from "@/types";
import type { GenerateReportRequest, ReportService } from "./interface";

export class ApiReportService implements ReportService {
  async list(): Promise<Report[]> {
    const { data } = await api.getPaged<ReportDto[]>("/reports", { page_size: 100 });
    return data.map(toReport);
  }

  async get(id: string): Promise<Report | null> {
    try {
      const r = await api.get<ReportDto>(`/reports/${id}`);
      return toReport(r);
    } catch (err) {
      if ((err as { status?: number })?.status === 404) return null;
      throw err;
    }
  }

  async generate(req: GenerateReportRequest): Promise<Report> {
    const r = await api.post<ReportDto>("/reports", {
      title: req.title,
      category: req.category,
      fmt: req.format,
      device_ids: req.deviceIds,
    });
    return toReport(r);
  }
}
