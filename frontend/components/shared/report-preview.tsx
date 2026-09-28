import { FileText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { scoreTone } from "@/constants/severity";
import { Separator } from "@/components/ui/separator";
import { SeverityBadge } from "./badges";
import type { Report } from "@/types";

/**
 * Professional, print-styled report preview. Phase 1 renders a structured
 * document from mock data — no real PDF/Excel binary is produced.
 */
export function ReportPreview({ report }: { report: Report }) {
  const p = report.preview;
  const tone = scoreTone(p.complianceScore);
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-border bg-white text-[hsl(222_47%_11%)] shadow-lg">
      {/* Letterhead */}
      <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(199_89%_45%)] text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Network Compliance Platform</p>
            <p className="text-xs text-slate-500">{report.title}</p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>{report.format} · {report.category.replace("_", " ")}</p>
          <p>{formatDateTime(report.generatedAt)}</p>
        </div>
      </div>

      <div className="space-y-6 px-8 py-6">
        <Section title="Executive Summary">
          <p className="text-sm leading-relaxed text-slate-700">
            {p.executiveSummary}
          </p>
        </Section>

        {p.device && (
          <Section title="Device Information">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <Row k="Hostname" v={p.device.hostname} />
              <Row k="Vendor" v={p.device.vendor} />
              <Row k="Model" v={p.device.model} />
              <Row k="OS" v={p.device.os} />
              <Row k="IP Address" v={p.device.ipAddress} />
            </dl>
          </Section>
        )}

        <Section title="Compliance Score">
          <div className="flex items-center gap-4">
            <span
              className="text-4xl font-bold"
              style={{ color: tone.hex }}
            >
              {p.complianceScore}%
            </span>
            <span className="text-sm text-slate-500">
              {report.findingsCount} findings across {report.deviceCount} device
              {report.deviceCount > 1 ? "s" : ""}
            </span>
          </div>
        </Section>

        {p.frameworkResults.length > 0 && (
          <Section title="Framework Results">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-1.5">Framework</th>
                  <th className="py-1.5">Score</th>
                  <th className="py-1.5">Pass</th>
                  <th className="py-1.5">Fail</th>
                </tr>
              </thead>
              <tbody>
                {p.frameworkResults.map((f) => (
                  <tr key={f.framework} className="border-b border-slate-100">
                    <td className="py-1.5">{f.framework}</td>
                    <td className="py-1.5 font-medium">{f.score}%</td>
                    <td className="py-1.5 text-emerald-600">{f.pass}</td>
                    <td className="py-1.5 text-red-600">{f.fail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {p.findings.length > 0 && (
          <Section title="Key Findings">
            <div className="space-y-3">
              {p.findings.map((f) => (
                <div
                  key={f.id}
                  className="rounded-md border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{f.title}</p>
                    <SeverityBadge severity={f.severity as never} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {f.category} · {f.status}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="rounded bg-red-50 p-2 font-mono text-xs text-red-700">
                      {f.evidence}
                    </div>
                    <div className="rounded bg-emerald-50 p-2 font-mono text-xs text-emerald-700">
                      {f.remediation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {p.auditTrailRefs.length > 0 && (
          <Section title="Audit Trail">
            <p className="font-mono text-xs text-slate-500">
              {p.auditTrailRefs.join(" · ")}
            </p>
          </Section>
        )}

        <Separator className="bg-slate-200" />
        <p className="text-center text-[10px] text-slate-400">
          Generated by ANCP · Phase 1 prototype preview · Not a verified
          compliance certification.
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
