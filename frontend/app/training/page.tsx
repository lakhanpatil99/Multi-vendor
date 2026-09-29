"use client";

import * as React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Check,
  Pencil,
  X,
  Sparkles,
  ArrowRight,
  Cpu,
} from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { CONTROL_CATEGORIES, CONTROL_CATEGORY_META } from "@/constants/domain";
import { PageHeader } from "@/components/shared/page-header";
import { AIConfidence } from "@/components/shared/ai-confidence";
import {
  VendorBadge,
  CategoryBadge,
  OriginBadge,
} from "@/components/shared/badges";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ControlCategory, TrainingPattern } from "@/types";

const WORKFLOW = [
  "Raw configuration",
  "AI similarity analysis",
  "Suggested category",
  "Administrator review",
  "Normalized field",
  "Approve",
  "Learned pattern",
];

export default function TrainingCenterPage() {
  const { data: patterns, loading, reload } = useAsync(
    () => services.training.list(),
    []
  );
  const [active, setActive] = React.useState<TrainingPattern | null>(null);
  const [decided, setDecided] = React.useState<Record<string, string>>({});

  const pending = (patterns ?? []).filter((p) =>
    ["UNKNOWN", "AI_SUGGESTED", "PENDING_REVIEW"].includes(p.status)
  );

  return (
    <>
      <PageHeader
        title="AI Training Center"
        description="Teach the platform how to recognize unfamiliar network configuration patterns. Nothing becomes a compliance rule without human approval."
        icon={GraduationCap}
        accent="#22d3ee"
        actions={
          <Link href="/training/patterns">
            <Button variant="outline">
              <Cpu className="h-4 w-4" /> Learned Patterns
            </Button>
          </Link>
        }
      />

      {/* Workflow strip */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 py-4">
          {WORKFLOW.map((step, i) => (
            <React.Fragment key={step}>
              <span className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs">
                {step}
              </span>
              {i < WORKFLOW.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              )}
            </React.Fragment>
          ))}
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState />
      ) : pending.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No unknown patterns"
          description="Your current configuration knowledge base has recognized all analyzed patterns."
          action={
            <Link href="/training/patterns">
              <Button variant="outline">View Learned Patterns</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pending.map((p) => (
            <PatternCard
              key={p.id}
              pattern={p}
              decision={decided[p.id]}
              onReview={() => setActive(p)}
            />
          ))}
        </div>
      )}

      {active && (
        <ReviewPanel
          pattern={active}
          onClose={() => setActive(null)}
          onDecided={(decision) => {
            setDecided((d) => ({ ...d, [active.id]: decision }));
            setActive(null);
            reload();
          }}
        />
      )}
    </>
  );
}

function PatternCard({
  pattern,
  decision,
  onReview,
}: {
  pattern: TrainingPattern;
  decision?: string;
  onReview: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-sm">Unknown Configuration</CardTitle>
          <VendorBadge vendorId={pattern.vendorId} />
          <span className="text-xs text-muted-foreground">{pattern.os}</span>
          {decision && (
            <span
              className={cn(
                "ml-auto rounded-md px-2 py-0.5 text-xs font-medium",
                decision === "REJECT"
                  ? "bg-muted/40 text-muted-foreground"
                  : "bg-success/10 text-success"
              )}
            >
              {decision === "REJECT" ? "Rejected" : "Learned"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            Pattern
          </p>
          <pre className="config-surface overflow-auto whitespace-pre-wrap rounded-md bg-[hsl(222_47%_5%)] p-2 text-xs">
            {pattern.snippet}
          </pre>
        </div>
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <OriginBadge origin="AI_ASSISTED" />
            <span className="text-sm">{pattern.aiSuggestion.interpretation}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <CategoryBadge category={pattern.suggestedCategory} />
            <span className="font-mono text-xs text-muted-foreground">
              {pattern.suggestedField}
            </span>
          </div>
          <div className="mt-3 max-w-[240px]">
            <AIConfidence confidence={pattern.aiSuggestion.confidence} />
          </div>
        </div>
        <Button className="w-full" onClick={onReview} disabled={!!decision}>
          {decision ? "Reviewed" : "Review"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ReviewPanel({
  pattern,
  onClose,
  onDecided,
}: {
  pattern: TrainingPattern;
  onClose: () => void;
  onDecided: (decision: string) => void;
}) {
  const [category, setCategory] = React.useState<ControlCategory>(
    pattern.suggestedCategory
  );
  const [field, setField] = React.useState(pattern.suggestedField);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function decide(decision: "APPROVE" | "MODIFY" | "REJECT") {
    setBusy(true);
    await services.training.review({
      patternId: pattern.id,
      decision,
      category,
      field,
      note,
    });
    setBusy(false);
    onDecided(decision);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <Card className="relative z-10 w-full max-w-2xl animate-fade-in">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Review Unknown Pattern</CardTitle>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <VendorBadge vendorId={pattern.vendorId} />
            <span className="text-xs text-muted-foreground">{pattern.os}</span>
          </div>
          <pre className="config-surface overflow-auto whitespace-pre-wrap rounded-md bg-[hsl(222_47%_5%)] p-3 text-xs">
            {pattern.snippet}
          </pre>

          {/* Similar patterns that informed the AI */}
          {pattern.aiSuggestion.similarPatterns.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                Similar known patterns
              </p>
              <div className="space-y-1.5">
                {pattern.aiSuggestion.similarPatterns.map((s) => (
                  <div
                    key={s.patternId}
                    className="flex items-center gap-2 rounded-md border border-border bg-surface p-2 text-xs"
                  >
                    <span className="font-mono text-muted-foreground">{s.snippet}</span>
                    <span className="ml-auto text-primary">
                      {Math.round(s.similarity * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-xs">
            <AIConfidence confidence={pattern.aiSuggestion.confidence} />
          </div>

          {/* Editable normalized mapping */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Security Category</Label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as ControlCategory)}
              >
                {CONTROL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CONTROL_CATEGORY_META[c].label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Normalized Field</Label>
              <Input value={field} onChange={(e) => setField(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Review Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Rationale for this decision…"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="success" disabled={busy} onClick={() => decide("APPROVE")}>
              <Check className="h-4 w-4" /> Approve
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => decide("MODIFY")}>
              <Pencil className="h-4 w-4" /> Approve with Changes
            </Button>
            <Button variant="destructive" disabled={busy} onClick={() => decide("REJECT")}>
              <X className="h-4 w-4" /> Reject
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Approving maps this pattern to <b>{field}</b> under{" "}
            <b>{CONTROL_CATEGORY_META[category].label}</b> and adds it to the
            learned knowledge base.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
