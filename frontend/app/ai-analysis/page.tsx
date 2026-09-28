"use client";

import Link from "next/link";
import { Sparkles, Cpu, HelpCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { PATTERN_STATUS_META } from "@/constants/domain";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { AIConfidence } from "@/components/shared/ai-confidence";
import { OriginBadge, CategoryBadge, VendorBadge } from "@/components/shared/badges";
import { LoadingState } from "@/components/shared/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AIAnalysisPage() {
  const { data: patterns, loading } = useAsync(() => services.training.list(), []);
  const { data: queue } = useAsync(() => services.training.queueSummary(), []);

  if (loading || !patterns) {
    return (
      <>
        <PageHeader title="AI Analysis" icon={Sparkles} />
        <LoadingState />
      </>
    );
  }

  const known = patterns.filter((p) => p.status === "LEARNED");
  const unknown = patterns.filter((p) =>
    ["UNKNOWN", "AI_SUGGESTED", "PENDING_REVIEW"].includes(p.status)
  );

  return (
    <>
      <PageHeader
        title="AI Analysis"
        description="The deterministic + AI hybrid model: known patterns resolve to security facts automatically; unknown patterns get an AI interpretation that must pass human review."
        icon={Sparkles}
        accent="#22d3ee"
        actions={
          <Link href="/training">
            <Button>
              Training Center <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Known Patterns" value={known.length} icon={CheckCircle2} accent="text-success" />
        <MetricCard label="Unknown Patterns" value={queue?.unknownPatterns ?? unknown.length} icon={HelpCircle} accent="text-medium" />
        <MetricCard label="Pending Review" value={queue?.pendingReview ?? 0} icon={Sparkles} accent="text-high" />
        <MetricCard label="Learned Today" value={queue?.learnedToday ?? 0} icon={Cpu} accent="text-success" />
      </div>

      {/* Hybrid model explainer */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-success/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success">Deterministic Path (Known)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <Flow steps={["Known configuration", "Deterministic parser", "Security fact", "Compliance rule"]} tone="#2bb673" />
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary">AI Path (Unknown)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <Flow
              steps={[
                "Unknown configuration",
                "Similarity / AI analysis",
                "Suggested interpretation",
                "Human review",
                "Approved mapping",
                "Knowledge base",
              ]}
              tone="#22d3ee"
            />
          </CardContent>
        </Card>
      </div>

      {/* AI suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI Suggestions Awaiting Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {unknown.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex flex-wrap items-center gap-2">
                <VendorBadge vendorId={p.vendorId} />
                <CategoryBadge category={p.suggestedCategory} />
                <OriginBadge origin="AI_ASSISTED" />
                <span className={`ml-auto rounded-md px-2 py-0.5 text-xs ${PATTERN_STATUS_META[p.status].bg} ${PATTERN_STATUS_META[p.status].text}`}>
                  {PATTERN_STATUS_META[p.status].label}
                </span>
              </div>
              <pre className="config-surface mt-2 overflow-auto whitespace-pre-wrap rounded-md bg-[hsl(222_47%_5%)] p-2 text-xs">
                {p.snippet}
              </pre>
              <p className="mt-2 text-sm">
                <span className="text-muted-foreground">AI interpretation: </span>
                {p.aiSuggestion.interpretation}
              </p>
              <div className="mt-2 max-w-xs">
                <AIConfidence confidence={p.aiSuggestion.confidence} />
              </div>
              <Link href="/training" className="mt-3 inline-block">
                <Button size="sm" variant="outline">
                  Review in Training Center <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function Flow({ steps, tone }: { steps: string[]; tone: string }) {
  return (
    <ol className="space-y-1.5">
      {steps.map((s, i) => (
        <li key={i} className="flex items-center gap-2">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: tone }}
          >
            {i + 1}
          </span>
          <span className="text-foreground/90">{s}</span>
        </li>
      ))}
    </ol>
  );
}
