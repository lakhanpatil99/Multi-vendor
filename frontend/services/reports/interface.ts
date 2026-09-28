import type { Report, ReportCategory, ReportFormat } from "@/types";

export interface GenerateReportRequest {
  title: string;
  category: ReportCategory;
  format: ReportFormat;
  deviceIds: string[];
}

export interface ReportService {
  list(): Promise<Report[]>;
  get(id: string): Promise<Report | null>;
  /** Simulate report generation (no real PDF/Excel produced in Phase 1). */
  generate(req: GenerateReportRequest): Promise<Report>;
}
