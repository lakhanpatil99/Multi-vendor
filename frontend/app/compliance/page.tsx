"use client";

import Link from "next/link";
import { ClipboardCheck, ArrowRight } from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { scoreTone } from "@/constants/severity";
import { FRAMEWORK_META, CONTROL_CATEGORY_META } from "@/constants/domain";
import { PageHeader } from "@/components/shared/page-header";
import { ComplianceScore } from "@/components/shared/compliance-score";
import { ChartCard } from "@/components/shared/chart-card";
import { FrameworkBadge } from "@/components/shared/badges";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VBarChart } from "@/components/charts/charts";

export default function CompliancePage() {
  const { data, loading, error, reload } = useAsync(
    () => services.compliance.overview(),
    []
  );

  if (loading) {
    return (
      <>
        <PageHeader title="Compliance Overview" icon={ClipboardCheck} />
        <LoadingState />
      </>
    );
  }
  if (error || !data) {
    return (
      <>
        <PageHeader title="Compliance Overview" icon={ClipboardCheck} />
        <ErrorState description={error ?? "Failed to load compliance data."} onRetry={reload} />
      </>
    );
  }

  const sb = data.statusBreakdown;

  return (
    <>
      <PageHeader
        title="Compliance Overview"
        description="One security model, evaluated across multiple frameworks. Drill into any control to reach the underlying evidence."
        icon={ClipboardCheck}
        accent="#2bb673"
        actions={
          <Link href="/frameworks">
            <Button variant="outline">
              Framework Mapping <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      {/* Overall + status */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <ComplianceScore score={data.overallScore} size={140} />
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-4 lg:col-span-3">
          <StatusCard label="Pass" value={sb.pass} tone="#2bb673" />
          <StatusCard label="Fail" value={sb.fail} tone="#e5484d" />
          <StatusCard label="N/A" value={sb.na} tone="#8b97a7" />
          <StatusCard label="Unknown" value={sb.unknown} tone="#f5a524" />
        </div>
      </div>

      {/* Frameworks */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.frameworks.map((f) => {
          const tone = scoreTone(f.score);
          return (
            <Link key={f.id} href="/frameworks">
              <Card className="transition-colors hover:border-primary/40">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <FrameworkBadge id={f.id} />
                  <span className="text-xs text-muted-foreground">{f.version}</span>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold" style={{ color: tone.hex }}>
                    {f.score}%
                  </p>
                  <p className="text-xs text-muted-foreground">{f.name}</p>
                  <div className="mt-3 flex gap-3 text-xs">
                    <span className="text-success">{f.controlsPass} pass</span>
                    <span className="text-critical">{f.controlsFail} fail</span>
                    <span className="text-muted-foreground">{f.controlsUnknown} unk</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Category scores */}
      <ChartCard
        title="Control Category Compliance"
        description="Compliance score per security control category"
      >
        <VBarChart
          data={data.categories.map((c) => ({
            name: CONTROL_CATEGORY_META[c.category].short,
            value: c.score,
            hex: CONTROL_CATEGORY_META[c.category].hex,
          }))}
          height={260}
        />
      </ChartCard>

      {/* Category detail list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Control Categories</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {data.categories.map((c) => {
            const tone = scoreTone(c.score);
            return (
              <Link
                key={c.category}
                href={`/findings?category=${c.category}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 hover:bg-surface-overlay"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CONTROL_CATEGORY_META[c.category].hex }}
                />
                <span className="text-sm font-medium">{c.label}</span>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {c.fail} fail · {c.pass} pass
                  </span>
                  <span className="text-sm font-semibold" style={{ color: tone.hex }}>
                    {c.score}%
                  </span>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}

function StatusCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold" style={{ color: tone }}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
