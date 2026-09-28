"use client";

import Link from "next/link";
import { Wrench, ArrowRight } from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { PageHeader } from "@/components/shared/page-header";
import { SeverityBadge, VendorBadge } from "@/components/shared/badges";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApprovalState, RemediationStatus } from "@/types";

export default function RemediationCenterPage() {
  const { data: items, loading } = useAsync(() => services.remediation.list(), []);

  return (
    <>
      <PageHeader
        title="Remediation Center"
        description="Vendor-specific hardening actions for each finding. Phase 1 displays simulated commands only — nothing is ever executed."
        icon={Wrench}
        accent="#f2680c"
      />

      {loading ? (
        <LoadingState />
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No remediations"
          description="Remediations appear here as findings are generated."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Finding</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/remediation/${r.id}`} className="hover:text-primary">
                      {r.findingTitle}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{r.deviceHostname}</TableCell>
                  <TableCell>
                    <VendorBadge vendorId={r.vendorId} />
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={r.severity} />
                  </TableCell>
                  <TableCell>
                    <StatusPill status={r.status} />
                  </TableCell>
                  <TableCell>
                    <ApprovalPill approval={r.approval} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/remediation/${r.id}`}>
                      <Button size="sm" variant="ghost">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}

function StatusPill({ status }: { status: RemediationStatus }) {
  const map: Record<RemediationStatus, string> = {
    OPEN: "text-muted-foreground bg-muted/40",
    PROPOSED: "text-primary bg-primary/10",
    APPROVED: "text-success bg-success/10",
    APPLIED: "text-success bg-success/10",
    VERIFIED: "text-success bg-success/10",
    REJECTED: "text-critical bg-critical/10",
  };
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

function ApprovalPill({ approval }: { approval: ApprovalState }) {
  const map: Record<ApprovalState, string> = {
    PENDING: "text-medium bg-medium/10",
    APPROVED: "text-success bg-success/10",
    REJECTED: "text-critical bg-critical/10",
  };
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${map[approval]}`}>
      {approval}
    </span>
  );
}
