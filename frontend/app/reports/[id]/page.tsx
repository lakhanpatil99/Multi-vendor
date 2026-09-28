"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FileBarChart, Download, Printer } from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { PageHeader } from "@/components/shared/page-header";
import { ReportPreview } from "@/components/shared/report-preview";
import { InlineLoading, EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: report, loading } = useAsync(() => services.reports.get(id), [id]);

  if (loading) return <InlineLoading label="Loading report…" />;
  if (!report)
    return (
      <EmptyState
        icon={FileBarChart}
        title="Report not found"
        description="This report does not exist."
        action={
          <Link href="/reports">
            <Button variant="outline">Back to Reports</Button>
          </Link>
        }
      />
    );

  return (
    <>
      <PageHeader
        title={report.title}
        description={`${report.format} · ${report.category.replace("_", " ")} · ${report.sizeLabel}`}
        icon={FileBarChart}
        accent="#8b5cf6"
        actions={
          <>
            <Button variant="outline" disabled title="Phase 1 preview only">
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button disabled title="Binary export arrives with backend (Phase 9)">
              <Download className="h-4 w-4" /> Export {report.format}
            </Button>
          </>
        }
      />

      <div className="rounded-lg border border-border bg-surface/40 p-4 lg:p-8">
        <ReportPreview report={report} />
      </div>
    </>
  );
}
