import { FileCode2, MapPin, Target } from "lucide-react";
import type { FindingEvidence } from "@/types";

/**
 * Evidence-first display: WHAT was found, WHERE, and WHAT was expected.
 */
export function EvidenceViewer({ evidence }: { evidence: FindingEvidence }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <FileCode2 className="h-4 w-4 text-primary" />
          {evidence.configurationName}
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          {evidence.deviceHostname}
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Target className="h-4 w-4 text-primary" />
          Line{evidence.lines.length > 1 ? "s" : ""} {evidence.lines.join(", ")}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-critical/30 bg-critical/5">
          <div className="border-b border-critical/20 px-3 py-1.5 text-xs font-medium text-critical">
            What was found
          </div>
          <pre className="config-surface overflow-auto whitespace-pre-wrap p-3 text-critical/90">
            {evidence.snippet}
          </pre>
        </div>
        <div className="overflow-hidden rounded-lg border border-success/30 bg-success/5">
          <div className="border-b border-success/20 px-3 py-1.5 text-xs font-medium text-success">
            What should have been there
          </div>
          <pre className="config-surface overflow-auto whitespace-pre-wrap p-3 text-success/90">
            {evidence.expectedSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
