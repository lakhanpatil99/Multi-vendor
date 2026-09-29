import { api } from "@/lib/api/client";
import { toFramework } from "@/lib/api/adapters";
import type { ComplianceOverviewDto, FrameworkDto } from "@/lib/api/dto";
import { CONTROL_CATEGORY_META } from "@/constants/domain";
import type {
  CategoryCompliance,
  ComplianceFramework,
  ComplianceOverview,
  ControlCategory,
} from "@/types";
import type { ComplianceService } from "./interface";

export class ApiComplianceService implements ComplianceService {
  async overview(): Promise<ComplianceOverview> {
    const [ov, fwDtos] = await Promise.all([
      api.get<ComplianceOverviewDto>("/compliance"),
      api.get<FrameworkDto[]>("/frameworks"),
    ]);
    const fwMeta = new Map(fwDtos.map((f) => [f.key, f]));

    const frameworks: ComplianceFramework[] = ov.frameworks.map((f) => {
      const meta = fwMeta.get(f.framework);
      const base = meta
        ? toFramework(meta, f.score)
        : toFramework(
            { id: f.framework, key: f.framework, name: f.framework, version: "", description: "", status: "ACTIVE" },
            f.score
          );
      return {
        ...base,
        controlsTotal: f.passed + f.failed,
        controlsPass: f.passed,
        controlsFail: f.failed,
      };
    });

    const categories: CategoryCompliance[] = ov.categories.map((c) => ({
      category: c.category as ControlCategory,
      label:
        CONTROL_CATEGORY_META[c.category as ControlCategory]?.label ?? c.category,
      score: c.score ?? (c.fail > 0 ? 0 : 100),
      pass: c.pass ?? 0,
      fail: c.fail,
      na: 0,
      unknown: 0,
    }));

    return {
      overallScore: ov.overall_score,
      statusBreakdown: ov.status_breakdown,
      frameworks,
      categories,
      // No historical series is stored yet (Phase 4+); expose the current point.
      trend: [{ date: "Now", score: ov.overall_score }],
    };
  }

  async frameworks(): Promise<ComplianceFramework[]> {
    const fwDtos = await api.get<FrameworkDto[]>("/frameworks");
    return fwDtos.map((f) => toFramework(f));
  }
}
