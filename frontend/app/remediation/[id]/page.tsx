"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Wrench,
  Terminal,
  CheckSquare,
  Undo2,
  ShieldAlert,
  Check,
  X,
} from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { PageHeader } from "@/components/shared/page-header";
import { SeverityBadge, VendorBadge } from "@/components/shared/badges";
import { DiffViewer } from "@/components/shared/diff-viewer";
import { InlineLoading, EmptyState } from "@/components/shared/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ApprovalState } from "@/types";

export default function RemediationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useAsync(() => services.remediation.get(id), [id]);
  const [approval, setApproval] = React.useState<ApprovalState | null>(null);
  const [busy, setBusy] = React.useState(false);

  if (loading) return <InlineLoading label="Loading remediation…" />;
  if (!data)
    return (
      <EmptyState
        icon={Wrench}
        title="Remediation not found"
        description="This remediation does not exist."
        action={
          <Link href="/remediation">
            <Button variant="outline">Back to Remediation</Button>
          </Link>
        }
      />
    );

  const currentApproval = approval ?? data.approval;

  async function decide(decision: "APPROVED" | "REJECTED") {
    setBusy(true);
    const updated = await services.remediation.decide(data!.id, decision);
    setApproval(updated.approval);
    setBusy(false);
  }

  return (
    <>
      <PageHeader
        title={data.findingTitle}
        description={`${data.deviceHostname} · ${data.vendorName} ${data.os}`}
        icon={Wrench}
        accent="#f2680c"
        actions={
          <>
            <SeverityBadge severity={data.severity} />
            <VendorBadge vendorId={data.vendorId} />
            <Link href={`/findings/${data.findingId}`}>
              <Button variant="outline">View Finding</Button>
            </Link>
          </>
        }
      />

      {/* Safety banner */}
      <div className="flex items-start gap-2 rounded-lg border border-medium/30 bg-medium/5 p-3 text-sm">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-medium" />
        <p className="text-muted-foreground">
          <b className="text-foreground">Simulated commands.</b> ANCP never
          executes remediation in Phase 1. Approval is recorded conceptually to
          demonstrate the human-in-the-loop workflow.
          {data.disruptive && (
            <span className="text-high">
              {" "}
              This change is potentially disruptive — schedule a maintenance window.
            </span>
          )}
        </p>
      </div>

      {/* Current vs expected */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Current vs Expected Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <DiffViewer current={data.currentConfig} expected={data.expectedConfig} />
        </CardContent>
      </Card>

      {/* Fix commands */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Terminal className="h-4 w-4 text-primary" /> Recommended Vendor-Specific Fix
            <span className="ml-2 rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-muted-foreground">
              {data.vendorName} {data.os}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border bg-[hsl(222_47%_5%)]">
            <div className="border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
              simulated · not executed
            </div>
            <pre className="config-surface overflow-auto p-3">
              {data.fixCommands.map((c, i) => (
                <div key={i} className="leading-6">
                  <span className="select-none text-muted-foreground/50">$ </span>
                  <span className="text-success/90">{c}</span>
                </div>
              ))}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Verification + rollback */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckSquare className="h-4 w-4 text-primary" /> Verification Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {data.verificationSteps.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="font-mono">{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Undo2 className="h-4 w-4 text-primary" /> Rollback Guidance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="config-surface overflow-auto whitespace-pre-wrap rounded-md bg-[hsl(222_47%_5%)] p-3 text-xs text-muted-foreground">
              {data.rollbackGuidance.join("\n")}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Approval */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <span className="text-sm text-muted-foreground">Approval decision:</span>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
              currentApproval === "APPROVED"
                ? "bg-success/10 text-success"
                : currentApproval === "REJECTED"
                ? "bg-critical/10 text-critical"
                : "bg-medium/10 text-medium"
            }`}
          >
            {currentApproval}
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="success" size="sm" disabled={busy} onClick={() => decide("APPROVED")}>
              <Check className="h-4 w-4" /> Approve
            </Button>
            <Button variant="destructive" size="sm" disabled={busy} onClick={() => decide("REJECTED")}>
              <X className="h-4 w-4" /> Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
