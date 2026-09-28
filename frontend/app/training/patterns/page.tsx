"use client";

import Link from "next/link";
import { Cpu, GraduationCap } from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { formatDate } from "@/lib/utils";
import { PATTERN_STATUS_META } from "@/constants/domain";
import { PageHeader } from "@/components/shared/page-header";
import { VendorBadge, CategoryBadge } from "@/components/shared/badges";
import { AIConfidence } from "@/components/shared/ai-confidence";
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
import type { PatternStatus } from "@/types";

export default function LearnedPatternsPage() {
  const { data: patterns, loading } = useAsync(() => services.training.list(), []);

  if (loading || !patterns) {
    return (
      <>
        <PageHeader title="Learned Patterns" icon={Cpu} />
        <LoadingState />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Learned Patterns"
        description="The knowledge base of human-approved configuration patterns that now resolve deterministically."
        icon={Cpu}
        accent="#2bb673"
        actions={
          <Link href="/training">
            <Button variant="outline">
              <GraduationCap className="h-4 w-4" /> Training Center
            </Button>
          </Link>
        }
      />

      {patterns.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No learned patterns yet"
          description="Approve unknown patterns in the Training Center to grow the knowledge base."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pattern</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Normalized Field</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patterns.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-[220px]">
                    <span className="font-mono text-xs text-muted-foreground line-clamp-2">
                      {p.snippet.split("\n")[0]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <VendorBadge vendorId={p.vendorId} />
                  </TableCell>
                  <TableCell className="text-sm">{p.os}</TableCell>
                  <TableCell>
                    <CategoryBadge category={p.suggestedCategory} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.suggestedField}</TableCell>
                  <TableCell className="w-32">
                    <AIConfidence confidence={p.aiSuggestion.confidence} showLabel={false} />
                  </TableCell>
                  <TableCell className="text-sm">{p.usageCount}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(p.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={p.status} />
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

function StatusPill({ status }: { status: PatternStatus }) {
  const meta = PATTERN_STATUS_META[status];
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${meta.bg} ${meta.text}`}>
      {meta.label}
    </span>
  );
}
