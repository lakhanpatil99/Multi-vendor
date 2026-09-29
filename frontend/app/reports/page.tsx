"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileBarChart,
  FileText,
  FileSpreadsheet,
  Plus,
  ArrowRight,
} from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { formatDateTime } from "@/lib/utils";
import { scoreTone } from "@/constants/severity";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { friendlyMessage } from "@/lib/api/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReportCategory, ReportStatus } from "@/types";

const CATEGORY_LABEL: Record<ReportCategory, string> = {
  DEVICE: "Device Report",
  COMPLIANCE: "Compliance Report",
  FRAMEWORK: "Framework Report",
  FINDING: "Finding Report",
  EXECUTIVE_SUMMARY: "Executive Summary",
};

export default function ReportsPage() {
  const { data: reports, loading, error, reload } = useAsync(
    () => services.reports.list(),
    []
  );
  const [generating, setGenerating] = React.useState(false);
  const [genError, setGenError] = React.useState<string | null>(null);

  async function quickGenerate() {
    setGenerating(true);
    setGenError(null);
    try {
      // Empty deviceIds → backend covers all devices in the organization.
      await services.reports.generate({
        title: "Fleet Compliance Report",
        category: "COMPLIANCE",
        format: "PDF",
        deviceIds: [],
      });
      reload();
    } catch (err) {
      setGenError(friendlyMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Reporting Center"
        description="Generate audit-ready PDF and Excel reports from real analysis results."
        icon={FileBarChart}
        accent="#8b5cf6"
        actions={
          <Button onClick={quickGenerate} disabled={generating}>
            <Plus className="h-4 w-4" /> {generating ? "Generating…" : "Generate Report"}
          </Button>
        }
      />

      {genError && (
        <div className="rounded-lg border border-critical/30 bg-critical/5 p-3 text-sm text-critical">
          {genError}
        </div>
      )}

      {/* Report categories */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {(Object.keys(CATEGORY_LABEL) as ReportCategory[]).map((c) => (
          <Card key={c} className="p-3">
            <FileText className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-medium">{CATEGORY_LABEL[c]}</p>
          </Card>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : !reports || reports.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title="No reports yet"
          description="Generate your first audit-ready report from analyzed devices."
          action={<Button onClick={quickGenerate}>Generate Report</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => {
            const tone = scoreTone(r.complianceScore);
            const Icon = r.format === "EXCEL" ? FileSpreadsheet : FileText;
            return (
              <Card key={r.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-overlay text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <StatusPill status={r.status} />
                  </div>
                  <CardTitle className="mt-2 text-sm">{r.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{CATEGORY_LABEL[r.category]}</span>
                    <span>·</span>
                    <span>{r.format}</span>
                    <span>·</span>
                    <span>{r.deviceCount} device{r.deviceCount > 1 ? "s" : ""}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-lg font-semibold" style={{ color: tone.hex }}>
                      {r.complianceScore}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.findingsCount} findings
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(r.generatedAt)} · {r.generatedBy}
                  </p>
                  <div className="mt-auto pt-3">
                    <Link href={`/reports/${r.id}`}>
                      <Button variant="outline" size="sm" className="w-full" disabled={r.status === "GENERATING"}>
                        {r.status === "GENERATING" ? "Generating…" : "Open Preview"}
                        {r.status !== "GENERATING" && <ArrowRight className="h-4 w-4" />}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function StatusPill({ status }: { status: ReportStatus }) {
  const map: Record<ReportStatus, string> = {
    READY: "text-success bg-success/10",
    GENERATING: "text-primary bg-primary/10 animate-pulse-soft",
    FAILED: "text-critical bg-critical/10",
    DRAFT: "text-muted-foreground bg-muted/40",
  };
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  );
}
