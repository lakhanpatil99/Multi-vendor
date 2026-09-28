"use client";

import Link from "next/link";
import {
  Server,
  FileStack,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  ArrowUpRight,
  Sparkles,
  Layers,
  PieChart as PieIcon,
  Activity,
  GitCompareArrows,
} from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import {
  MOCK_DASHBOARD_METRICS,
  MOCK_RISK_DISTRIBUTION,
  MOCK_VENDOR_DISTRIBUTION,
  MOCK_KNOWLEDGE_QUEUE,
} from "@/mock";
import { SEVERITY_TOKENS, scoreTone } from "@/constants/severity";
import { CONTROL_CATEGORY_META, FRAMEWORK_META } from "@/constants/domain";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { ChartCard } from "@/components/shared/chart-card";
import { ComplianceScore } from "@/components/shared/compliance-score";
import { FrameworkBadge } from "@/components/shared/badges";
import { LoadingState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendChart,
  DonutChart,
  HBarChart,
  VBarChart,
  FrameworkRadar,
} from "@/components/charts/charts";

export default function DashboardPage() {
  const m = MOCK_DASHBOARD_METRICS;
  const { data: overview, loading } = useAsync(
    () => services.compliance.overview(),
    []
  );

  if (loading || !overview) {
    return (
      <>
        <PageHeader
          title="Compliance Dashboard"
          description="What is the security and compliance state of my network right now?"
          icon={Activity}
        />
        <LoadingState />
      </>
    );
  }

  const riskData = MOCK_RISK_DISTRIBUTION.map((r) => ({
    name: SEVERITY_TOKENS[r.severity].label,
    value: r.count,
    hex: SEVERITY_TOKENS[r.severity].hex,
  }));
  const vendorData = MOCK_VENDOR_DISTRIBUTION.map((v) => ({
    name: v.vendor,
    value: v.devices,
    hex: v.hex,
  }));
  const categoryData = overview.categories.map((c) => ({
    name: CONTROL_CATEGORY_META[c.category].short,
    value: c.score,
    hex: CONTROL_CATEGORY_META[c.category].hex,
  }));
  const frameworkRadar = overview.frameworks.map((f) => ({
    framework: f.shortName,
    score: f.score,
  }));
  const sb = overview.statusBreakdown;
  const totalStatus = sb.pass + sb.fail + sb.na + sb.unknown;

  return (
    <>
      <PageHeader
        title="Compliance Dashboard"
        description="What is the security and compliance state of my network right now?"
        icon={Activity}
        actions={
          <Link href="/configurations/upload">
            <Button>
              <FileStack className="h-4 w-4" /> Upload Configuration
            </Button>
          </Link>
        }
      />

      {/* Top metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <MetricCard label="Devices Analyzed" value={m.devicesAnalyzed} icon={Server} />
        <MetricCard
          label="Configs Processed"
          value={m.configurationsProcessed}
          icon={FileStack}
        />
        <MetricCard
          label="Overall Compliance"
          value={`${m.overallCompliance}%`}
          icon={ShieldCheck}
          accent="text-success"
        />
        <MetricCard
          label="Critical Findings"
          value={m.criticalFindings}
          icon={ShieldAlert}
          accent="text-critical"
        />
        <MetricCard
          label="High Findings"
          value={m.highFindings}
          icon={AlertTriangle}
          accent="text-high"
        />
        <MetricCard
          label="Unknown Patterns"
          value={m.unknownPatterns}
          icon={HelpCircle}
          accent="text-medium"
        />
      </div>

      {/* Health + Trend + Knowledge Queue */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Network Compliance Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Network Compliance Health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ComplianceScore score={overview.overallScore} size={140} />
            <div className="grid w-full grid-cols-2 gap-2">
              <HealthStat label="Pass" value={sb.pass} total={totalStatus} tone="#2bb673" />
              <HealthStat label="Fail" value={sb.fail} total={totalStatus} tone="#e5484d" />
              <HealthStat label="N/A" value={sb.na} total={totalStatus} tone="#8b97a7" />
              <HealthStat label="Unknown" value={sb.unknown} total={totalStatus} tone="#f5a524" />
            </div>
          </CardContent>
        </Card>

        {/* Compliance trend */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Compliance Trend"
            description="Overall compliance score over the last 6 months"
            icon={Activity}
          >
            <TrendChart data={overview.trend} />
          </ChartCard>
        </div>
      </div>

      {/* AI Knowledge Queue + Framework correlation */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-primary/30 bg-primary/[0.04]">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" /> AI Knowledge Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-semibold">
                {MOCK_KNOWLEDGE_QUEUE.unknownPatterns}
              </p>
              <p className="text-xs text-muted-foreground">Unknown Patterns</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <QueueStat value={MOCK_KNOWLEDGE_QUEUE.pendingReview} label="Pending" tone="text-high" />
              <QueueStat value={MOCK_KNOWLEDGE_QUEUE.learnedToday} label="Learned" tone="text-success" />
              <QueueStat value={MOCK_KNOWLEDGE_QUEUE.rejectedToday} label="Rejected" tone="text-muted-foreground" />
            </div>
            <Link href="/training" className="block">
              <Button className="w-full" variant="outline">
                Review Patterns <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <ChartCard
            title="Framework Compliance Correlation"
            description="One security model evaluated across CIS · NIST · STIG · ISO"
            icon={GitCompareArrows}
            action={
              <Link href="/frameworks">
                <Button size="sm" variant="ghost">
                  Drill in <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FrameworkRadar data={frameworkRadar} />
              <div className="space-y-2">
                {overview.frameworks.map((f) => {
                  const tone = scoreTone(f.score);
                  return (
                    <Link
                      key={f.id}
                      href="/frameworks"
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5 hover:bg-surface-overlay"
                    >
                      <FrameworkBadge id={f.id} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{f.name}</span>
                          <span className="font-medium" style={{ color: tone.hex }}>
                            {f.score}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted/50">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${f.score}%`, backgroundColor: tone.hex }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Distributions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Risk Distribution" description="Findings by severity" icon={ShieldAlert}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <DonutChart data={riskData} />
            </div>
            <div className="space-y-1.5">
              {riskData.map((r) => (
                <div key={r.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: r.hex }} />
                  <span className="text-muted-foreground">{r.name}</span>
                  <span className="ml-auto font-medium">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Vendor Distribution" description="Analyzed devices by vendor" icon={PieIcon}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <DonutChart data={vendorData} />
            </div>
            <div className="space-y-1.5">
              {vendorData.map((v) => (
                <div key={v.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: v.hex }} />
                  <span className="text-muted-foreground">{v.name}</span>
                  <span className="ml-auto font-medium">{v.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Framework Compliance" description="Score by framework" icon={Layers}>
          <HBarChart
            data={overview.frameworks.map((f) => ({
              name: f.shortName,
              value: f.score,
              hex: FRAMEWORK_META[f.id].hex,
            }))}
            height={220}
          />
        </ChartCard>
      </div>

      {/* Control category distribution */}
      <ChartCard
        title="Control Category Distribution"
        description="Compliance score across security control categories"
        icon={Layers}
      >
        <VBarChart data={categoryData} height={260} />
      </ChartCard>
    </>
  );
}

function HealthStat({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: string;
}) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rounded-lg border border-border bg-surface p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold" style={{ color: tone }}>
          {value}
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted/50">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: tone }} />
      </div>
    </div>
  );
}

function QueueStat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-2">
      <p className={`text-lg font-semibold ${tone}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
