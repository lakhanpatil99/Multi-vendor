"use client";

import { Settings, ShieldCheck, Lock, Eye, Plus } from "lucide-react";
import { MOCK_VENDORS } from "@/mock";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SYNTAX_LABEL: Record<string, string> = {
  FLAT: "Flat / command-oriented",
  HIERARCHICAL: "Hierarchical",
  BLOCK: "Block-based",
};

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Platform configuration, vendor definitions, and data-protection controls."
        icon={Settings}
        accent="#8b97a7"
      />

      {/* Vendor definitions — dynamic, not hard-coded */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm">Vendor Definitions</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Vendors are data-driven. New vendors (Arista, Palo Alto, SONiC…) can
              be enabled without code changes.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled title="Backend integration pending">
            <Plus className="h-4 w-4" /> Add Vendor
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_VENDORS.map((v) => (
            <div
              key={v.id}
              className="rounded-lg border border-border bg-surface p-3"
              style={{ borderLeftColor: v.accent, borderLeftWidth: 3 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{v.name}</span>
                {v.supported ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="muted">Available</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {SYNTAX_LABEL[v.syntaxStyle]}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                OS: {v.operatingSystems.join(", ")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security & data protection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-success" /> Security &amp; Data Protection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Toggle
            icon={Lock}
            label="Credential & secret masking"
            desc="Passwords, secrets, and keys are masked everywhere in the UI."
            on
          />
          <Toggle
            icon={Eye}
            label="Sensitive configuration warning"
            desc="Warn before displaying configurations that contain sensitive material."
            on
          />
          <Toggle
            icon={ShieldCheck}
            label="Secure upload indicator"
            desc="Show a secure-upload badge and mask secrets on ingestion."
            on
          />
          <Toggle
            icon={ShieldCheck}
            label="Audit trail"
            desc="Record every action to the immutable audit log."
            on
          />

          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Example masked configuration
            </p>
            <pre className="config-surface rounded-md bg-[hsl(222_47%_5%)] p-3 text-xs">
{`username admin
password ********
enable secret ********`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Phase notice */}
      <Card className="border-medium/30 bg-medium/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <b className="text-foreground">Phase 1 prototype.</b> Settings are
          presentational. Persistent configuration, role-based access control,
          and secure credential vaulting arrive with backend integration.
        </CardContent>
      </Card>
    </>
  );
}

function Toggle({
  icon: Icon,
  label,
  desc,
  on,
}: {
  icon: typeof Lock;
  label: string;
  desc: string;
  on?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <Icon className="h-4 w-4 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <span
        className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
          on ? "justify-end bg-success" : "justify-start bg-muted"
        }`}
      >
        <span className="h-4 w-4 rounded-full bg-white" />
      </span>
    </div>
  );
}
