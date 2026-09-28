"use client";

import { ScrollText } from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { PageHeader } from "@/components/shared/page-header";
import { AuditTimeline } from "@/components/shared/audit-timeline";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";

export default function AuditPage() {
  const { data: events, loading } = useAsync(() => services.audit.events(), []);

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Immutable trail of every ingestion, analysis, training, compliance, and reporting action for full traceability."
        icon={ScrollText}
        accent="#818cf8"
      />

      {loading ? (
        <LoadingState />
      ) : !events || events.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit events"
          description="Actions across the platform will appear here as they happen."
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <AuditTimeline events={events} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
