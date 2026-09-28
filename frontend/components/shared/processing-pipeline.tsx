import { Check, Loader2, AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStage } from "@/types";

/** Vertical staged-processing indicator for the ingestion workflow. */
export function ProcessingPipeline({ stages }: { stages: PipelineStage[] }) {
  return (
    <ol className="relative space-y-1">
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        return (
          <li key={stage.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StageIcon status={stage.status} />
              {!isLast && (
                <span
                  className={cn(
                    "w-px flex-1",
                    stage.status === "COMPLETE" ? "bg-primary/50" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className="pb-5">
              <p
                className={cn(
                  "text-sm font-medium",
                  stage.status === "PENDING" && "text-muted-foreground",
                  stage.status === "ACTIVE" && "text-primary",
                  stage.status === "COMPLETE" && "text-foreground",
                  stage.status === "FAILED" && "text-critical",
                  stage.status === "NEEDS_REVIEW" && "text-medium"
                )}
              >
                {stage.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {stage.detail ?? stage.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StageIcon({ status }: { status: PipelineStage["status"] }) {
  const base =
    "flex h-6 w-6 items-center justify-center rounded-full border text-xs";
  if (status === "COMPLETE")
    return (
      <span className={cn(base, "border-primary bg-primary text-primary-foreground")}>
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  if (status === "ACTIVE")
    return (
      <span className={cn(base, "border-primary text-primary")}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    );
  if (status === "FAILED")
    return (
      <span className={cn(base, "border-critical bg-critical/10 text-critical")}>
        <AlertTriangle className="h-3.5 w-3.5" />
      </span>
    );
  if (status === "NEEDS_REVIEW")
    return (
      <span className={cn(base, "border-medium bg-medium/10 text-medium")}>
        <AlertTriangle className="h-3.5 w-3.5" />
      </span>
    );
  return (
    <span className={cn(base, "border-border text-muted-foreground")}>
      <Circle className="h-2 w-2" />
    </span>
  );
}
