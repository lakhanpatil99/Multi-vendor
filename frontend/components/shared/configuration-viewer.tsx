"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { SyntaxStyle } from "@/types";

const SYNTAX_LABEL: Record<SyntaxStyle, string> = {
  FLAT: "Flat / command-oriented",
  HIERARCHICAL: "Hierarchical (nested stanzas)",
  BLOCK: "Block-based (config / edit / set / end)",
};

/**
 * Raw configuration viewer with line numbers and evidence highlighting.
 * Renders vendor syntax styles distinctly via a banner + subtle indentation
 * cues. Credentials in the source are already masked upstream.
 */
export function ConfigurationViewer({
  raw,
  syntaxStyle,
  highlightLines = [],
  className,
  title,
}: {
  raw: string;
  syntaxStyle: SyntaxStyle;
  highlightLines?: number[];
  className?: string;
  title?: string;
}) {
  const lines = raw.split("\n");
  const highlight = new Set(highlightLines);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-[hsl(222_47%_5%)]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {title ?? "Raw Configuration"}
        </span>
        <span className="rounded-md border border-border bg-surface-overlay px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {SYNTAX_LABEL[syntaxStyle]}
        </span>
      </div>
      <div className="config-surface max-h-[520px] overflow-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => {
              const lineNo = i + 1;
              const isHi = highlight.has(lineNo);
              return (
                <tr
                  key={i}
                  className={cn(
                    isHi && "bg-critical/15",
                    "hover:bg-white/[0.03]"
                  )}
                >
                  <td
                    className={cn(
                      "select-none border-r border-border/50 px-3 text-right align-top text-[11px] leading-6 text-muted-foreground/60",
                      isHi && "border-critical/40 text-critical"
                    )}
                    style={{ width: 1 }}
                  >
                    {lineNo}
                  </td>
                  <td
                    className={cn(
                      "whitespace-pre px-3 leading-6 text-foreground/90",
                      isHi && "text-foreground"
                    )}
                  >
                    {line || " "}
                    {isHi && (
                      <span className="ml-2 rounded bg-critical/30 px-1 text-[10px] uppercase text-critical">
                        evidence
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
