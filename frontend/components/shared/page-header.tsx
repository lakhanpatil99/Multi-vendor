import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  icon: Icon,
  accent,
  actions,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Left accent bar color (hex) to give each module its own identity. */
  accent?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {accent && (
          <span
            className="mt-1 h-9 w-1 rounded-full"
            style={{ backgroundColor: accent }}
          />
        )}
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-overlay text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
