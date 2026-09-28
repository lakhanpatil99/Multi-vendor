import { MOCK_REPORTS, getReport } from "@/mock";
import { delay } from "@/lib/utils";
import type { Report } from "@/types";
import type { GenerateReportRequest, ReportService } from "./interface";

export class MockReportService implements ReportService {
  async list(): Promise<Report[]> {
    await delay(150);
    return [...MOCK_REPORTS];
  }

  async get(id: string): Promise<Report | null> {
    await delay(120);
    return getReport(id) ?? null;
  }

  async generate(req: GenerateReportRequest): Promise<Report> {
    await delay(1200);
    // Phase 1: returns a structured preview; no binary file is generated.
    const template = MOCK_REPORTS[0];
    return {
      ...template,
      id: `rpt-${Math.random().toString(36).slice(2, 8)}`,
      title: req.title,
      category: req.category,
      format: req.format,
      status: "READY",
      deviceIds: req.deviceIds,
      deviceCount: req.deviceIds.length,
      generatedAt: new Date().toISOString(),
      generatedBy: "current.user",
    };
  }
}
