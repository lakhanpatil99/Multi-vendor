import { cn } from "@/lib/utils";
import {
  RISK_TOKENS,
  SEVERITY_TOKENS,
  STATUS_TOKENS,
} from "@/constants/severity";
import {
  CONTROL_CATEGORY_META,
  DETECTION_ORIGIN_META,
  FRAMEWORK_META,
} from "@/constants/domain";
import { getVendor } from "@/mock/vendors";
import type {
  ControlCategory,
  DetectionOrigin,
  FindingStatus,
  FrameworkId,
  RiskLevel,
  Severity,
} from "@/types";

function Pill({
  className,
  children,
  dot,
}: {
  className?: string;
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />}
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const t = SEVERITY_TOKENS[severity];
  return (
    <Pill className={cn(t.bg, t.border, t.text)} dot={t.dot}>
      {t.label}
    </Pill>
  );
}

export function StatusBadge({ status }: { status: FindingStatus }) {
  const t = STATUS_TOKENS[status];
  return (
    <Pill className={cn(t.bg, t.border, t.text)} dot={t.dot}>
      {t.label}
    </Pill>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const t = RISK_TOKENS[risk];
  return (
    <Pill className={cn(t.bg, t.border, t.text)} dot={t.dot}>
      {t.label}
    </Pill>
  );
}

export function VendorBadge({ vendorId }: { vendorId: string }) {
  const vendor = getVendor(vendorId);
  const accent = vendor?.accent ?? "#8b97a7";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium">
      <span
        className="h-2 w-2 rounded-sm"
        style={{ backgroundColor: accent }}
      />
      {vendor?.name ?? vendorId}
    </span>
  );
}

export function FrameworkBadge({ id }: { id: FrameworkId }) {
  const meta = FRAMEWORK_META[id];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium"
      style={{
        color: meta.hex,
        borderColor: `${meta.hex}55`,
        backgroundColor: `${meta.hex}14`,
      }}
    >
      {meta.short}
    </span>
  );
}

export function CategoryBadge({ category }: { category: ControlCategory }) {
  const meta = CONTROL_CATEGORY_META[category];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium text-foreground/85">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.hex }}
      />
      {meta.label}
    </span>
  );
}

export function OriginBadge({ origin }: { origin: DetectionOrigin }) {
  const meta = DETECTION_ORIGIN_META[origin];
  const isAi = origin === "AI_ASSISTED";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        isAi
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-success/30 bg-success/10 text-success"
      )}
      title={meta.description}
    >
      {meta.label}
    </span>
  );
}
