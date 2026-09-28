import { cn } from "@/lib/utils";

/** AI confidence meter. Color scales from amber (low) to cyan (high). */
export function AIConfidence({
  confidence,
  className,
  showLabel = true,
}: {
  confidence: number;
  className?: string;
  showLabel?: boolean;
}) {
  const c = Math.min(100, Math.max(0, confidence));
  const tone =
    c >= 85 ? "#22d3ee" : c >= 70 ? "#1ba3ec" : c >= 50 ? "#f5a524" : "#e5484d";
  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">AI Confidence</span>
          <span className="font-medium" style={{ color: tone }}>
            {c}%
          </span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${c}%`, backgroundColor: tone }}
        />
      </div>
    </div>
  );
}
