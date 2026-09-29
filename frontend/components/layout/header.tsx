"use client";

import * as React from "react";
import { ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { Breadcrumb } from "./breadcrumb";
import { Notifications } from "./notifications";
import { useAuth } from "@/lib/auth/auth-context";

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

        <UserMenu />
      </div>
    </header>
  );
}

function UserMenu() {
  const { principal, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const email = principal?.email ?? "user";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1 hover:bg-surface-overlay"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/50 text-xs font-semibold text-primary-foreground">
          {initials}
        </span>
        <div className="hidden text-left leading-tight lg:block">
          <p className="text-xs font-medium">{email}</p>
          <p className="text-[10px] text-muted-foreground">
            {principal?.role ?? "—"}
          </p>
        </div>
        <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground lg:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-border bg-surface-overlay shadow-2xl animate-fade-in">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-critical/10 hover:text-critical"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
