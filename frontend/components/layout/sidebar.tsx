"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/constants/navigation";
import { PRODUCT } from "@/constants/domain";

function isActive(pathname: string, href: string, matchPrefix?: boolean) {
  if (href === pathname) return true;
  // exact-match items (like /configurations/upload) shouldn't trigger prefix parents incorrectly
  if (matchPrefix) return pathname.startsWith(href + "/") || pathname === href;
  return false;
}

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {PRODUCT.shortName}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              Network Compliance
            </p>
          </div>
          <button
            className="ml-auto text-muted-foreground lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href, item.matchPrefix);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "bg-primary/15 font-medium text-primary"
                            : "text-muted-foreground hover:bg-surface-overlay hover:text-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border px-4 py-3">
          <div className="rounded-lg border border-border bg-surface-overlay/60 p-2.5 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Phase 1 Prototype</span>
            <p className="mt-0.5">Mock services · no live backend</p>
          </div>
        </div>
      </aside>
    </>
  );
}
