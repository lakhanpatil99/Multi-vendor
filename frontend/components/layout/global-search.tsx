"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Network,
  FileStack,
  ShieldCheck,
  GitCompareArrows,
  Cpu,
  FileBarChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MOCK_DEVICES,
  MOCK_CONFIGURATIONS,
  MOCK_FINDINGS,
  MOCK_TRAINING_PATTERNS,
  MOCK_REPORTS,
} from "@/mock";
import { FRAMEWORK_META } from "@/constants/domain";

interface SearchResult {
  id: string;
  label: string;
  sub: string;
  group: string;
  href: string;
  icon: LucideIcon;
}

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];
  MOCK_DEVICES.forEach((d) =>
    results.push({
      id: d.id,
      label: d.hostname,
      sub: `${d.vendorName} · ${d.model}`,
      group: "Devices",
      href: `/devices/${d.id}`,
      icon: Network,
    })
  );
  MOCK_CONFIGURATIONS.forEach((c) =>
    results.push({
      id: c.id,
      label: c.name,
      sub: `${c.vendorName} · ${c.os}`,
      group: "Configurations",
      href: `/configurations/${c.id}`,
      icon: FileStack,
    })
  );
  MOCK_FINDINGS.forEach((f) =>
    results.push({
      id: f.id,
      label: f.title,
      sub: `${f.deviceHostname} · ${f.severity}`,
      group: "Findings",
      href: `/findings/${f.id}`,
      icon: ShieldCheck,
    })
  );
  Object.values(FRAMEWORK_META).forEach((m) =>
    results.push({
      id: m.short,
      label: m.name,
      sub: "Framework mapping",
      group: "Frameworks",
      href: `/frameworks`,
      icon: GitCompareArrows,
    })
  );
  MOCK_TRAINING_PATTERNS.forEach((p) =>
    results.push({
      id: p.id,
      label: p.aiSuggestion.interpretation,
      sub: `${p.vendorName} · ${p.status}`,
      group: "Training Patterns",
      href: `/training/patterns`,
      icon: Cpu,
    })
  );
  MOCK_REPORTS.forEach((r) =>
    results.push({
      id: r.id,
      label: r.title,
      sub: `${r.format} · ${r.category}`,
      group: "Reports",
      href: `/reports/${r.id}`,
      icon: FileBarChart,
    })
  );
  return results;
}

const INDEX = buildIndex();

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return INDEX.slice(0, 8);
    const q = query.toLowerCase();
    return INDEX.filter(
      (r) =>
        r.label.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [query]);

  const groups = React.useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    filtered.forEach((r) => {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    });
    return Array.from(map.entries());
  }, [filtered]);

  if (!open) return null;

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 p-4 pt-[12vh]">
      <div
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface-overlay shadow-2xl animate-fade-in">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search devices, configurations, findings, frameworks, patterns, reports…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {groups.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
          {groups.map(([group, items]) => (
            <div key={group} className="mb-2">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group}
              </p>
              {items.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.group + r.id}
                    onClick={() => go(r.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-primary/10"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate">{r.label}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {r.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
