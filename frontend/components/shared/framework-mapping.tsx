import { getVendor } from "@/mock/vendors";
import { FRAMEWORK_META } from "@/constants/domain";
import type { FrameworkMapping as FrameworkMappingType } from "@/types";

/**
 * Renders the ONE finding -> MULTIPLE frameworks relationship as a set of
 * framework cards, each showing the mapped control id + title.
 */
export function FrameworkMappingGrid({
  mappings,
}: {
  mappings: FrameworkMappingType[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {mappings.map((m) => {
        const meta = FRAMEWORK_META[m.frameworkId];
        return (
          <div
            key={m.frameworkId + m.controlId}
            className="rounded-lg border border-border bg-surface p-3"
            style={{ borderLeftColor: meta.hex, borderLeftWidth: 3 }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: meta.hex }}
              >
                {m.frameworkName}
              </span>
              <span className="rounded-md border border-border bg-surface-overlay px-2 py-0.5 font-mono text-xs">
                {m.controlId}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-foreground/90">{m.controlTitle}</p>
            {m.rationale && (
              <p className="mt-1 text-xs text-muted-foreground">{m.rationale}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
