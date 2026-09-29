"use client";

import * as React from "react";
import Link from "next/link";
import { GitCompareArrows, ArrowRight } from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { FRAMEWORK_META } from "@/constants/domain";
import { PageHeader } from "@/components/shared/page-header";
import { FrameworkBadge, SeverityBadge, CategoryBadge } from "@/components/shared/badges";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Framework Mapping — communicates ONE canonical finding -> MULTIPLE framework
 * controls. Each finding expands to show its CIS/NIST/STIG/ISO references.
 */
export default function FrameworksPage() {
  const { data: findings, loading, error, reload } = useAsync(
    () => services.findings.list({ status: "FAIL" }),
    []
  );

  if (loading) {
    return (
      <>
        <PageHeader title="Framework Mapping" icon={GitCompareArrows} />
        <LoadingState />
      </>
    );
  }
  if (error || !findings) {
    return (
      <>
        <PageHeader title="Framework Mapping" icon={GitCompareArrows} />
        <ErrorState description={error ?? "Failed to load framework mappings."} onRetry={reload} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Framework Mapping"
        description="One security finding maps to multiple compliance frameworks. Control identifiers shown here are illustrative Phase 1 mocks, not verified certifications."
        icon={GitCompareArrows}
        accent="#8b5cf6"
      />

      {/* Framework legend */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(FRAMEWORK_META).map(([id, meta]) => (
          <Card key={id} style={{ borderLeftColor: meta.hex, borderLeftWidth: 3 }}>
            <CardContent className="py-4">
              <FrameworkBadge id={id as never} />
              <p className="mt-2 text-sm font-medium">{meta.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {findings.map((f) => (
          <Card key={f.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-sm">{f.title}</CardTitle>
                <SeverityBadge severity={f.severity} />
                <CategoryBadge category={f.category} />
                <span className="text-xs text-muted-foreground">{f.deviceHostname}</span>
                <Link href={`/findings/${f.id}`} className="ml-auto">
                  <Button size="sm" variant="ghost">
                    View finding <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {/* correlation visual */}
              <div className="grid gap-3 md:grid-cols-4">
                {f.frameworks.map((m) => {
                  const meta = FRAMEWORK_META[m.frameworkId];
                  return (
                    <div
                      key={m.frameworkId}
                      className="rounded-lg border border-border bg-surface p-3"
                      style={{ borderTopColor: meta.hex, borderTopWidth: 2 }}
                    >
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: meta.hex }}
                      >
                        {m.frameworkName}
                      </span>
                      <p className="mt-1 font-mono text-xs">{m.controlId}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {m.controlTitle}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
