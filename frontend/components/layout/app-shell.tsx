"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ServerCrash, ShieldCheck } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { GlobalSearch } from "./global-search";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { PRODUCT } from "@/constants/domain";

const PUBLIC_ROUTES = new Set(["/login"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { status, retry } = useAuth();

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Redirect unauthenticated users to /login (except on public routes).
  React.useEffect(() => {
    if (status === "unauthenticated" && !PUBLIC_ROUTES.has(pathname)) {
      router.replace("/login");
    }
  }, [status, pathname, router]);

  // Public routes (login) render bare — no shell.
  if (PUBLIC_ROUTES.has(pathname)) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return <Splash label="Restoring session…" spinning />;
  }

  if (status === "unavailable") {
    return (
      <Splash
        label="Backend unavailable"
        icon={<ServerCrash className="h-7 w-7 text-critical" />}
        sub="Check that the API server is running, then retry."
        action={<Button onClick={retry}>Retry</Button>}
      />
    );
  }

  if (status === "unauthenticated") {
    return <Splash label="Redirecting to sign in…" spinning />;
  }

  // Authenticated → full application shell.
  return (
    <div className="flex min-h-screen app-bg">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenu={() => setMobileOpen(true)}
          onSearch={() => setSearchOpen(true)}
        />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px] space-y-6">{children}</div>
        </main>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

function Splash({
  label,
  sub,
  icon,
  action,
  spinning,
}: {
  label: string;
  sub?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  spinning?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center app-bg px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-overlay text-primary">
        {icon ?? (spinning ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />)}
      </div>
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
      <p className="mt-8 text-[10px] uppercase tracking-widest text-muted-foreground/50">
        {PRODUCT.shortName}
      </p>
    </div>
  );
}
