"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import {
  SeverityBadge,
  StatusBadge,
  VendorBadge,
  CategoryBadge,
  FrameworkBadge,
} from "@/components/shared/badges";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ControlCategory, Severity } from "@/types";

function FindingsInner() {
  const params = useSearchParams();
  const initialCategory = params.get("category") ?? "all";

  const [search, setSearch] = React.useState("");
  const [vendor, setVendor] = React.useState("all");
  const [severity, setSeverity] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [category, setCategory] = React.useState(initialCategory);

  const { data: findings, loading } = useAsync(
    () =>
      services.findings.list({
        search,
        vendorId: vendor,
        severity: severity === "all" ? undefined : (severity as Severity),
        status,
        category: category === "all" ? undefined : (category as ControlCategory),
      }),
    [search, vendor, severity, status, category]
  );

  return (
    <>
      <PageHeader
        title="Findings"
        description="Evidence-backed security findings across all analyzed devices."
        icon={ShieldCheck}
        accent="#e5484d"
      />

      <FilterBar search={search} onSearch={setSearch} placeholder="Search findings, devices…">
        <Select value={vendor} onChange={(e) => setVendor(e.target.value)}>
          <option value="all">All Vendors</option>
          <option value="cisco">Cisco</option>
          <option value="juniper">Juniper</option>
          <option value="fortinet">FortiOS</option>
        </Select>
        <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="all">All Severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="FAIL">Fail</option>
          <option value="PASS">Pass</option>
          <option value="UNKNOWN">Unknown</option>
        </Select>
      </FilterBar>

      {loading ? (
        <LoadingState />
      ) : !findings || findings.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No findings match your filters"
          description="Adjust the filters, or analyze a configuration to generate findings."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Finding</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Frameworks</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {findings.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="max-w-[220px] font-medium">
                    <Link href={`/findings/${f.id}`} className="hover:text-primary">
                      {f.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{f.deviceHostname}</TableCell>
                  <TableCell>
                    <VendorBadge vendorId={f.vendorId} />
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
                    <div className="flex gap-1">
                      {f.frameworks.map((m) => (
                        <FrameworkBadge key={m.frameworkId} id={m.frameworkId} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(f.detectedAt)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/findings/${f.id}`}>
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

export default function FindingsPage() {
  return (
    <React.Suspense fallback={<LoadingState />}>
      <FindingsInner />
    </React.Suspense>
  );
}
