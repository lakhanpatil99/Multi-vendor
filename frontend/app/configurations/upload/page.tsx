"use client";

import * as React from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileUp,
  Plug,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { services } from "@/services";
import { friendlyMessage } from "@/lib/api/errors";
import {
  CISCO_IOS_CONFIG,
  FORTIOS_CONFIG,
  JUNIPER_JUNOS_CONFIG,
} from "@/mock/raw-configs";
import { PageHeader } from "@/components/shared/page-header";
import { ProcessingPipeline } from "@/components/shared/processing-pipeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { IngestionResult, PipelineStage } from "@/types";

type Mode = "upload" | "connect";

export default function UploadConfigurationPage() {
  const [mode, setMode] = React.useState<Mode>("upload");

  return (
    <>
      <PageHeader
        title="Ingest Configuration"
        description="Upload a configuration file or connect to a live device to begin the analysis pipeline."
        icon={UploadCloud}
        accent="#1ba3ec"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <ModeCard
          active={mode === "upload"}
          onClick={() => setMode("upload")}
          icon={FileUp}
          title="Upload Configuration"
          desc="Provide a .txt, .cfg, or .conf configuration file."
        />
        <ModeCard
          active={mode === "connect"}
          onClick={() => setMode("connect")}
          icon={Plug}
          title="Connect to Device"
          desc="Collect the running configuration over SSH (prototype)."
        />
      </div>

      {mode === "upload" ? <UploadFlow /> : <ConnectFlow />}
    </>
  );
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof FileUp;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-surface hover:bg-surface-overlay"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          active ? "bg-primary text-primary-foreground" : "bg-surface-overlay text-primary"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

function UploadFlow() {
  const [stages, setStages] = React.useState<PipelineStage[] | null>(null);
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<IngestionResult | null>(null);
  const [fileName, setFileName] = React.useState<string>("");
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function start(file: File) {
    setFileName(file.name);
    setRunning(true);
    setResult(null);
    setError(null);
    setStages(services.configurations.pipelineTemplate());
    try {
      const res = await services.configurations.runIngestion(file, (s) =>
        setStages(s)
      );
      setResult(res);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setRunning(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) start(f);
  }

  function sample(text: string, name: string) {
    // Sample configs are uploaded to the backend as real files (real ingestion).
    start(new File([text], name, { type: "text/plain" }));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">1. Select Configuration File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) start(f);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            <UploadCloud className="mb-3 h-8 w-8 text-primary" />
            <p className="text-sm font-medium">Drop a configuration file here</p>
            <p className="mt-1 text-xs text-muted-foreground">Supported: .txt · .cfg · .conf</p>
            <input
              type="file"
              accept=".txt,.cfg,.conf"
              className="hidden"
              onChange={onFile}
              disabled={running}
            />
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs">
              <Lock className="h-3.5 w-3.5 text-success" /> Secure upload · secrets masked server-side
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <p className="w-full text-xs text-muted-foreground">Or upload a sample:</p>
            <Button size="sm" variant="outline" disabled={running}
              onClick={() => sample(CISCO_IOS_CONFIG, "cisco-sample.cfg")}>
              Cisco IOS sample
            </Button>
            <Button size="sm" variant="outline" disabled={running}
              onClick={() => sample(JUNIPER_JUNOS_CONFIG, "juniper-sample.conf")}>
              Juniper sample
            </Button>
            <Button size="sm" variant="outline" disabled={running}
              onClick={() => sample(FORTIOS_CONFIG, "fortios-sample.conf")}>
              FortiOS sample
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Processing Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          {!stages ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Select a file to start the backend analysis pipeline.
            </p>
          ) : (
            <>
              <p className="mb-4 text-xs text-muted-foreground">{fileName}</p>
              <ProcessingPipeline stages={stages} />
              {error && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-critical/30 bg-critical/5 p-4 text-sm text-critical">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Analysis failed</p>
                    <p className="text-xs text-muted-foreground">{error}</p>
                  </div>
                </div>
              )}
              {result && (
                <div className="mt-2 rounded-lg border border-success/30 bg-success/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Analysis complete</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Vendor: <b className="text-foreground">{result.vendorName}</b></span>
                    <span>OS: <b className="text-foreground">{result.os}</b></span>
                    <span>Findings: <b className="text-foreground">{result.findingsCreated}</b></span>
                    <span>Unknown patterns: <b className="text-foreground">{result.unknownPatterns}</b></span>
                    <span>Compliance: <b className="text-foreground">{result.complianceScore}%</b></span>
                  </div>
                  <Link href={`/devices/${result.deviceId}`} className="mt-3 block">
                    <Button size="sm" className="w-full">
                      View Device Analysis <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConnectFlow() {
  const [vendorId, setVendorId] = React.useState("cisco");
  const [hostname, setHostname] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [credential, setCredential] = React.useState("");
  const [port, setPort] = React.useState("22");
  const [testing, setTesting] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  async function test() {
    setTesting(true);
    setMsg(null);
    try {
      const res = await services.configurations.connectionTest({
        method: "SSH",
        vendorId,
        hostname,
        username,
        credentialReference: credential,
        port: Number(port),
      });
      setMsg({ ok: res.ok, text: res.message });
    } catch (err) {
      setMsg({ ok: false, text: friendlyMessage(err) });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Connect to Device (SSH)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-medium/30 bg-medium/5 p-3 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-medium" />
          <p className="text-muted-foreground">
            <b className="text-foreground">Prototype / backend integration pending.</b>{" "}
            The backend does not open real connections or store credentials in this
            phase. Secure SSH/Netmiko collection arrives in a later phase.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Connection Method">
            <Select value="SSH" disabled>
              <option>SSH</option>
            </Select>
          </Field>
          <Field label="Device Vendor">
            <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="cisco">Cisco</option>
              <option value="juniper">Juniper</option>
              <option value="fortinet">FortiOS</option>
            </Select>
          </Field>
          <Field label="Hostname / IP">
            <Input value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="10.20.0.1" />
          </Field>
          <Field label="Port">
            <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="22" />
          </Field>
          <Field label="Username">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="netops" />
          </Field>
          <Field label="Password / Credential Reference">
            <Input type="password" value={credential} onChange={(e) => setCredential(e.target.value)} placeholder="vault://ssh/netops" />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={test} disabled={testing}>
            {testing ? "Testing…" : "Test Connection"}
          </Button>
          {msg && (
            <p className={cn("text-sm", msg.ok ? "text-medium" : "text-critical")}>{msg.text}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
