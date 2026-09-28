"use client";

import Link from "next/link";
import { FileStack, UploadCloud, Wifi, HardDrive } from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { VendorBadge } from "@/components/shared/badges";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnalysisStatus, ParserStatus } from "@/types";

export default function ConfigurationsPage() {
  const { data: configs, loading } = useAsync(
    () => services.configurations.list(),
    []
  );

  return (
    <>
      <PageHeader
        title="Configuration Center"
        description="Inventory of collected configurations, their parser state, and analysis progress."
        icon={FileStack}
        accent="#22d3ee"
        actions={
          <Link href="/configurations/upload">
            <Button>
              <UploadCloud className="h-4 w-4" /> Upload Configuration
            </Button>
          </Link>
        }
      />

      {loading ? (
        <LoadingState />
      ) : !configs || configs.length === 0 ? (
        <EmptyState
          icon={FileStack}
          title="No configurations yet"
          description="Upload a configuration file or connect to a device to build your inventory."
          action={
            <Link href="/configurations/upload">
              <Button>
                <UploadCloud className="h-4 w-4" /> Upload Configuration
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Configuration</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead>Parser</TableHead>
                <TableHead>Analysis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/configurations/${c.id}`} className="hover:text-primary">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{c.deviceHostname}</TableCell>
                  <TableCell>
                    <VendorBadge vendorId={c.vendorId} />
                  </TableCell>
                  <TableCell className="text-sm">{c.os}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      {c.source === "SSH" ? (
                        <Wifi className="h-3.5 w-3.5" />
                      ) : (
                        <HardDrive className="h-3.5 w-3.5" />
                      )}
                      {c.source === "SSH" ? "SSH" : "Upload"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{c.format}</TableCell>
                  <TableCell className="text-xs">{c.version}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(c.collectedAt)}
                  </TableCell>
                  <TableCell>
                    <ParserPill status={c.parserStatus} />
                  </TableCell>
                  <TableCell>
                    <AnalysisPill status={c.analysisStatus} />
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

function ParserPill({ status }: { status: ParserStatus }) {
  const map: Record<ParserStatus, string> = {
    PARSED: "text-success bg-success/10 border-success/30",
    PARTIAL: "text-medium bg-medium/10 border-medium/30",
    FAILED: "text-critical bg-critical/10 border-critical/30",
    PENDING: "text-muted-foreground bg-muted/40 border-border",
  };
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

function AnalysisPill({ status }: { status: AnalysisStatus }) {
  const map: Record<AnalysisStatus, string> = {
    COMPLETE: "text-success bg-success/10 border-success/30",
    IN_PROGRESS: "text-primary bg-primary/10 border-primary/30",
    QUEUED: "text-muted-foreground bg-muted/40 border-border",
    FAILED: "text-critical bg-critical/10 border-critical/30",
    NEEDS_REVIEW: "text-medium bg-medium/10 border-medium/30",
  };
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}
