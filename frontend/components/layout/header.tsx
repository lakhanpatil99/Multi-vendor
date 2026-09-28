"use client";

import { ChevronDown, Menu, Search } from "lucide-react";
import { Breadcrumb } from "./breadcrumb";
import { Notifications } from "./notifications";

export function Header({
  onMenu,
  onSearch,
}: {
  onMenu: () => void;
  onSearch: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
      <button
        className="text-muted-foreground lg:hidden"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Workspace selector */}
      <button className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-overlay sm:flex">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary">
          NW
        </span>
        <span className="font-medium">NetOps Workspace</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <div className="hidden md:block">
        <Breadcrumb />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onSearch}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface-overlay"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] sm:inline">
            Ctrl K
          </kbd>
        </button>

        <Notifications />

        {/* User profile */}
        <button className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1 hover:bg-surface-overlay">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/50 text-xs font-semibold text-primary-foreground">
            SK
          </span>
          <div className="hidden text-left leading-tight lg:block">
            <p className="text-xs font-medium">S. Kapoor</p>
            <p className="text-[10px] text-muted-foreground">Security Auditor</p>
          </div>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground lg:block" />
        </button>
      </div>
    </header>
  );
}
