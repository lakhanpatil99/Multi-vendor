"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Server,
  Cpu,
  Hash,
  Globe,
  Wifi,
  HardDrive,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { formatDateTime } from "@/lib/utils";
import { scoreTone } from "@/constants/severity";
import { PageHeader } from "@/components/shared/page-header";
import { ComplianceScore } from "@/components/shared/compliance-score";
import {
  RiskBadge,
  VendorBadge,
  SeverityBadge,
  StatusBadge,
  CategoryBadge,
} from "@/components/shared/badges";
import { ConfigurationViewer } from "@/components/shared/configuration-viewer";
import { JsonViewer } from "@/components/shared/json-viewer";
import { SecurityFactsTable } from "@/components/shared/security-facts";
import { AuditTimeline } from "@/components/shared/audit-timeline";
import { InlineLoading, EmptyState } from "@/components/shared/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: device, loading } = useAsync(() => services.devices.get(id), [id]);
  const { data: config } = useAsync(
    () => services.configurations.getByDevice(id),
    [id]
  );
  const { data: findings } = useAsync(
    () => services.findings.list({ deviceId: id }),
    [id]
  );
  const { data: remediations } = useAsync(() => services.remediation.list(), []);
  const { data: auditAll } = useAsync(() => services.audit.events(), []);

  if (loading) return <InlineLoading label="Loading device…" />;
  if (!device)
    return (
      <EmptyState
        icon={Server}
        title="Device not found"
        description="This device does not exist or has been removed."
        action={
          <Link href="/devices">
            <Button variant="outline">Back to Devices</Button>
          </Link>
        }
      />
    );

  const tone = scoreTone(device.complianceScore);
  const deviceRemediations = (remediations ?? []).filter(
    (r) => r.deviceId === id
  );
  const auditEvents = (auditAll ?? []).filter((e) => e.deviceId === id);
  // Derive accurate finding rollups from the real findings query (the device
  // DTO carries no per-status counts).
  const fList = findings ?? [];
  const derived = {
    critical: fList.filter((f) => f.severity === "CRITICAL").length,
    high: fList.filter((f) => f.severity === "HIGH").length,
    fail: fList.filter((f) => f.status === "FAIL").length,
    pass: fList.filter((f) => f.status === "PASS").length,
    unknown: fList.filter((f) => f.status === "UNKNOWN").length,
  };

  return (
    <>
      <PageHeader
        title={device.hostname}
        description={`${device.vendorName} ${device.model} · ${device.os} ${device.osVersion}`}
        icon={Server}
        accent={tone.hex}
        actions={
          <>
            <RiskBadge risk={device.riskLevel} />
            <Link href="/reports">
              <Button variant="outline">Generate Report</Button>
            </Link>
          </>
        }
      />

      {/* Identity strip */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">Device Identity</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Identity icon={Server} label="Vendor" value={device.vendorName} />
            <Identity icon={Cpu} label="Model" value={device.model} />
            <Identity icon={Hash} label="Serial" value={device.serialNumber} />
            <Identity icon={Server} label="OS / Firmware" value={`${device.os} ${device.osVersion}`} />
            <Identity icon={Globe} label="IP Address" value={device.ipAddress} />
            <Identity
              icon={device.source === "SSH" ? Wifi : HardDrive}
              label="Collection"
              value={device.source === "SSH" ? "SSH (live)" : "Uploaded config"}
            />
            <Identity icon={Clock} label="Last Analysis" value={formatDateTime(device.lastAnalysis)} />
            <Identity icon={Server} label="Type" value={device.deviceType} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex h-full flex-col items-center justify-center py-6">
            <ComplianceScore score={device.complianceScore} size={130} />
            <div className="mt-3 flex gap-3 text-xs">
              <span className="text-success">{device.findingsSummary.pass} pass</span>
              <span className="text-critical">{device.findingsSummary.fail} fail</span>
              <span className="text-medium">{device.findingsSummary.unknown} unk</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="normalized">Normalized Model</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="remediation">Remediation</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Findings Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <SummaryBox label="Critical" value={derived.critical} tone="#e5484d" />
                <SummaryBox label="High" value={derived.high} tone="#f2680c" />
                <SummaryBox label="Findings" value={fList.length} tone="#1ba3ec" />
                <SummaryBox label="Fail" value={derived.fail} tone="#e5484d" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Findings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(findings ?? []).slice(0, 5).map((f) => (
                  <Link
                    key={f.id}
                    href={`/findings/${f.id}`}
                    className="flex items-center gap-2 rounded-md border border-border bg-surface p-2 hover:bg-surface-overlay"
                  >
                    <SeverityBadge severity={f.severity} />
                    <span className="flex-1 truncate text-sm">{f.title}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuration */}
        <TabsContent value="configuration">
          {config ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {config.name} · {config.format} · {config.lineCount} lines
                </p>
                <Link href={`/configurations/${config.id}`}>
                  <Button variant="outline" size="sm">
                    Open in Configuration Center <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <ConfigurationViewer raw={config.raw} syntaxStyle={config.syntaxStyle} />
            </div>
          ) : (
            <EmptyState title="No configuration" description="No configuration is associated with this device yet." />
          )}
        </TabsContent>

        {/* Normalized model */}
        <TabsContent value="normalized">
          {config ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium">Vendor-Neutral Model</p>
                <JsonViewer data={config.normalized} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Security Facts</p>
                <Card>
                  <SecurityFactsTable facts={config.securityFacts} />
                </Card>
              </div>
            </div>
          ) : (
            <EmptyState title="No normalized model" description="Run analysis to produce a normalized model." />
          )}
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Findings by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {groupByCategory(findings ?? []).map(([cat, items]) => (
                <div key={cat} className="flex items-center gap-3 rounded-md border border-border bg-surface p-2.5">
                  <CategoryBadge category={cat as never} />
                  <span className="ml-auto text-xs text-muted-foreground">
                    {items.filter((i) => i.status === "FAIL").length} fail · {items.length} total
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Findings */}
        <TabsContent value="findings">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Finding</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(findings ?? []).map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">
                      <Link href={`/findings/${f.id}`} className="hover:text-primary">
                        {f.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={f.category} />
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={f.severity} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={f.status} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/findings/${f.id}`}>
                        <Button size="sm" variant="ghost">
                          View <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Remediation */}
        <TabsContent value="remediation">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Finding</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deviceRemediations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.findingTitle}</TableCell>
                    <TableCell>
                      <SeverityBadge severity={r.severity} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.status}</TableCell>
                    <TableCell>
                      <Link href={`/remediation/${r.id}`}>
                        <Button size="sm" variant="ghost">
                          View <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports">
          <EmptyState
            title="Reports"
            description="Generate an audit-ready PDF or Excel report for this device from the Reporting Center."
            action={
              <Link href="/reports">
                <Button variant="outline">Open Reporting Center</Button>
              </Link>
            }
          />
        </TabsContent>

        {/* Audit trail */}
        <TabsContent value="audit">
          {auditEvents.length > 0 ? (
            <Card>
              <CardContent className="pt-5">
                <AuditTimeline events={auditEvents} />
              </CardContent>
            </Card>
          ) : (
            <EmptyState title="No audit events" description="No audit events recorded for this device yet." />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

function Identity({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function SummaryBox({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-2xl font-semibold" style={{ color: tone }}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function groupByCategory<T extends { category: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  items.forEach((i) => {
    if (!map.has(i.category)) map.set(i.category, []);
    map.get(i.category)!.push(i);
  });
  return Array.from(map.entries());
}
