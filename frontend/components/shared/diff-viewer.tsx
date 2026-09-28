import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Simple current-vs-expected diff. Left column is the current (non-compliant)
 * state, right is the expected (compliant) state.
 */
export function DiffViewer({
  current,
  expected,
  currentLabel = "Current",
  expectedLabel = "Expected",
  className,
}: {
  current: string;
  expected: string;
  currentLabel?: string;
  expectedLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      <DiffPane
        label={currentLabel}
        text={current}
        tone="removed"
        icon={<Minus className="h-3.5 w-3.5" />}
      />
      <DiffPane
        label={expectedLabel}
        text={expected}
        tone="added"
        icon={<Plus className="h-3.5 w-3.5" />}
      />
    </div>
  );
}

function DiffPane({
  label,
  text,
  tone,
  icon,
}: {
  label: string;
  text: string;
  tone: "added" | "removed";
  icon: React.ReactNode;
}) {
  const lines = text.split("\n");
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[hsl(222_47%_5%)]">
      <div
        className={cn(
          "flex items-center gap-1.5 border-b border-border px-3 py-1.5 text-xs font-medium",
          tone === "removed" ? "text-critical" : "text-success"
        )}
      >
        {icon}
        {label}
      </div>
      <div className="config-surface p-3">
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              "whitespace-pre rounded px-2 leading-6",
              tone === "removed"
                ? "bg-critical/10 text-critical/90"
                : "bg-success/10 text-success/90"
            )}
          >
            {tone === "removed" ? "- " : "+ "}
            {l || " "}
          </div>
        ))}
      </div>
    </div>
  );
}
