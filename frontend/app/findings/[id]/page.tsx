"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  AlertOctagon,
  Target,
  CheckSquare,
  Wrench,
  FileCode2,
} from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import {
  SeverityBadge,
  StatusBadge,
  VendorBadge,
  CategoryBadge,
  OriginBadge,
} from "@/components/shared/badges";
import { EvidenceViewer } from "@/components/shared/evidence-viewer";
import { FrameworkMappingGrid } from "@/components/shared/framework-mapping";
import { ConfigurationViewer } from "@/components/shared/configuration-viewer";
import { InlineLoading, EmptyState } from "@/components/shared/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FindingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: finding, loading } = useAsync(
    () => services.findings.get(id),
    [id]
  );
  const { data: config } = useAsync(
    () =>
      finding
        ? services.configurations.get(finding.evidence.configurationId)
        : Promise.resolve(null),
    [finding?.id]
  );

  if (loading) return <InlineLoading label="Loading finding…" />;
  if (!finding)
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Finding not found"
        description="This finding does not exist."
        action={
          <Link href="/findings">
            <Button variant="outline">Back to Findings</Button>
          </Link>
        }
      />
    );

  return (
    <>
      <PageHeader
        title={finding.title}
        description={finding.summary}
        icon={ShieldCheck}
        accent="#e5484d"
        actions={
          <>
            <SeverityBadge severity={finding.severity} />
            <StatusBadge status={finding.status} />
            {finding.remediationId && (
              <Link href={`/remediation/${finding.remediationId}`}>
                <Button variant="outline">
                  <Wrench className="h-4 w-4" /> Remediation
                </Button>
              </Link>
            )}
          </>
        }
      />

      {/* Meta strip */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-sm">
          <Meta label="Finding ID" value={finding.id} mono />
          <Meta label="Rule ID" value={finding.ruleId} mono />
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-muted-foreground">Device</span>
            <Link href={`/devices/${finding.deviceId}`} className="font-medium hover:text-primary">
              {finding.deviceHostname}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-muted-foreground">Vendor</span>
            <VendorBadge vendorId={finding.vendorId} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-muted-foreground">Category</span>
            <CategoryBadge category={finding.category} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-muted-foreground">Detection</span>
            <OriginBadge origin={finding.origin} />
          </div>
          <Meta label="Detected" value={formatDateTime(finding.detectedAt)} />
        </CardContent>
      </Card>

      {/* Current vs expected */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-critical/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-critical">
              <AlertOctagon className="h-4 w-4" /> Current State
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="config-surface whitespace-pre-wrap rounded-md bg-critical/5 p-3 text-critical/90">
              {finding.currentValue}
            </pre>
          </CardContent>
        </Card>
        <Card className="border-success/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-success">
              <Target className="h-4 w-4" /> Expected State
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="config-surface whitespace-pre-wrap rounded-md bg-success/5 p-3 text-success/90">
              {finding.expectedValue}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Security impact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Security Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {finding.securityImpact}
          </p>
        </CardContent>
      </Card>

      {/* Evidence */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileCode2 className="h-4 w-4 text-primary" /> Evidence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EvidenceViewer evidence={finding.evidence} />
          {config && (
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                Highlighted in source configuration:
              </p>
              <ConfigurationViewer
                raw={config.raw}
                syntaxStyle={config.syntaxStyle}
                highlightLines={finding.evidence.lines}
                title={config.name}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Framework mapping */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Framework Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <FrameworkMappingGrid mappings={finding.frameworks} />
        </CardContent>
      </Card>

      {/* Verification */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CheckSquare className="h-4 w-4 text-primary" /> Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {finding.verification.map((v, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="font-mono">{v}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-sm" : "text-sm font-medium"}>{value}</span>
    </div>
  );
}
