import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  icon: Icon,
  accent = "text-primary",
  hint,
  trend,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  hint?: string;
  trend?: { direction: "up" | "down" | "flat"; label: string };
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg bg-surface-overlay",
            accent
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <p
          className={cn(
            "mt-3 text-xs",
            trend.direction === "up" && "text-success",
            trend.direction === "down" && "text-critical",
            trend.direction === "flat" && "text-muted-foreground"
          )}
        >
          {trend.label}
        </p>
      )}
    </Card>
  );
}
