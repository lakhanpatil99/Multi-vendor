"use client";

import * as React from "react";
import Link from "next/link";
import { Network, Upload, HardDrive, Wifi } from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { formatDateTime } from "@/lib/utils";
import { scoreTone } from "@/constants/severity";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { RiskBadge, VendorBadge } from "@/components/shared/badges";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DeviceStatus } from "@/types";

const STATUS_LABEL: Record<DeviceStatus, string> = {
  ANALYZED: "Analyzed",
  PROCESSING: "Processing",
  PENDING: "Pending",
  FAILED: "Failed",
  NEEDS_REVIEW: "Needs Review",
};

export default function DevicesPage() {
  const [vendor, setVendor] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const { data: devices, loading } = useAsync(
    () => services.devices.list({ vendorId: vendor, status, search }),
    [vendor, status, search]
  );

  return (
    <>
      <PageHeader
        title="Devices"
        description="Network infrastructure analyzed by ANCP across all vendors and collection methods."
        icon={Network}
        accent="#1ba3ec"
        actions={
          <Link href="/configurations/upload">
            <Button>
              <Upload className="h-4 w-4" /> Add Device
            </Button>
          </Link>
        }
      />

      <FilterBar search={search} onSearch={setSearch} placeholder="Search hostname, IP, model…">
        <Select value={vendor} onChange={(e) => setVendor(e.target.value)}>
          <option value="all">All Vendors</option>
          <option value="cisco">Cisco</option>
          <option value="juniper">Juniper</option>
          <option value="fortinet">FortiOS</option>
          <option value="other">Other</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="ANALYZED">Analyzed</option>
          <option value="PROCESSING">Processing</option>
          <option value="NEEDS_REVIEW">Needs Review</option>
          <option value="FAILED">Failed</option>
        </Select>
      </FilterBar>

      {loading ? (
        <LoadingState />
      ) : !devices || devices.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No devices analyzed yet"
          description="Upload your first network configuration to begin compliance analysis."
          action={
            <Link href="/configurations/upload">
              <Button>
                <Upload className="h-4 w-4" /> Upload Configuration
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hostname</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Last Analysis</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((d) => {
                const tone = scoreTone(d.complianceScore);
                return (
                  <TableRow key={d.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/devices/${d.id}`} className="hover:text-primary">
                        {d.hostname}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <VendorBadge vendorId={d.vendorId} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.deviceType}
                    </TableCell>
                    <TableCell className="text-sm">{d.model}</TableCell>
                    <TableCell className="text-sm">
                      {d.os} {d.osVersion}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{d.ipAddress}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        {d.source === "SSH" ? (
                          <Wifi className="h-3.5 w-3.5" />
                        ) : (
                          <HardDrive className="h-3.5 w-3.5" />
                        )}
                        {d.source === "SSH" ? "SSH" : "Upload"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold" style={{ color: tone.hex }}>
                        {d.complianceScore}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <RiskBadge risk={d.riskLevel} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(d.lastAnalysis)}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={d.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}

function StatusPill({ status }: { status: DeviceStatus }) {
  const tone: Record<DeviceStatus, string> = {
    ANALYZED: "text-success bg-success/10 border-success/30",
    PROCESSING: "text-primary bg-primary/10 border-primary/30",
    PENDING: "text-muted-foreground bg-muted/40 border-border",
    FAILED: "text-critical bg-critical/10 border-critical/30",
    NEEDS_REVIEW: "text-medium bg-medium/10 border-medium/30",
  };
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${tone[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
