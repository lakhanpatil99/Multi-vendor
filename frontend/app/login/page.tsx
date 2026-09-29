"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogIn, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { friendlyMessage } from "@/lib/api/errors";
import { PRODUCT } from "@/constants/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { login, status } = useAuth();
  const [token, setTokenValue] = React.useState("dev-local-token");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(token.trim());
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center app-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold">{PRODUCT.shortName}</h1>
          <p className="text-xs text-muted-foreground">{PRODUCT.name}</p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-xl border border-border bg-surface p-6"
        >
          <div className="space-y-1.5">
            <Label htmlFor="token">Access Token</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setTokenValue(e.target.value)}
              placeholder="Bearer token"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              Dev mode accepts the seeded token. In production this is a Supabase
              session token.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-critical/30 bg-critical/5 p-2.5 text-xs text-critical">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={busy || !token.trim()}>
            <LogIn className="h-4 w-4" />
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
