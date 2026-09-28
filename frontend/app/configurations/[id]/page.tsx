"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FileStack, ShieldCheck, Braces, FileCode2 } from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { PageHeader } from "@/components/shared/page-header";
import { VendorBadge } from "@/components/shared/badges";
import { ConfigurationViewer } from "@/components/shared/configuration-viewer";
import { JsonViewer } from "@/components/shared/json-viewer";
import { SecurityFactsTable } from "@/components/shared/security-facts";
import { InlineLoading, EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ConfigurationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: config, loading } = useAsync(
    () => services.configurations.get(id),
    [id]
  );

  if (loading) return <InlineLoading label="Loading configuration…" />;
  if (!config)
    return (
      <EmptyState
        icon={FileStack}
        title="Configuration not found"
        description="This configuration does not exist."
        action={
          <Link href="/configurations">
            <Button variant="outline">Back to Configurations</Button>
          </Link>
        }
      />
    );

  return (
    <>
      <PageHeader
        title={config.name}
        description={`${config.deviceHostname} · ${config.os} ${config.version} · ${config.lineCount} lines`}
        icon={FileStack}
        accent="#22d3ee"
        actions={
          <>
            <VendorBadge vendorId={config.vendorId} />
            <Link href={`/devices/${config.deviceId}`}>
              <Button variant="outline">View Device</Button>
            </Link>
          </>
        }
      />

      <Tabs defaultValue="raw">
        <TabsList>
          <TabsTrigger value="raw">
            <FileCode2 className="mr-1.5 h-4 w-4" /> Raw Configuration
          </TabsTrigger>
          <TabsTrigger value="normalized">
            <Braces className="mr-1.5 h-4 w-4" /> Normalized Model
          </TabsTrigger>
          <TabsTrigger value="facts">
            <ShieldCheck className="mr-1.5 h-4 w-4" /> Security Facts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="raw">
          <ConfigurationViewer raw={config.raw} syntaxStyle={config.syntaxStyle} />
        </TabsContent>

        <TabsContent value="normalized">
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <JsonViewer data={config.normalized} />
            </div>
            <Card className="lg:col-span-2 p-4 text-sm text-muted-foreground">
              <p className="mb-2 font-medium text-foreground">About normalization</p>
              <p>
                The raw vendor configuration is transformed into a vendor-neutral
                model. The same security domains (remote access, authentication,
                logging, SNMP, NTP, access control) are represented identically
                regardless of vendor syntax, enabling one compliance engine to
                evaluate Cisco, Juniper, and FortiOS alike.
              </p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="facts">
          <Card>
            <SecurityFactsTable facts={config.securityFacts} />
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
