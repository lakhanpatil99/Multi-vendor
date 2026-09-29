"use client";

import * as React from "react";
import {
  getToken,
  setToken,
  setUnauthorizedHandler,
} from "@/lib/api/client";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { MeDto } from "@/lib/api/dto";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "unavailable";

export interface Principal {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  status: AuthStatus;
  principal: Principal | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  retry: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>("loading");
  const [principal, setPrincipal] = React.useState<Principal | null>(null);

  const restore = React.useCallback(async () => {
    const token = getToken();
    if (!token) {
      setStatus("unauthenticated");
      setPrincipal(null);
      return;
    }
    setStatus("loading");
    try {
      const me = await api.get<MeDto>("/auth/me");
      setPrincipal({
        userId: me.user_id,
        organizationId: me.organization_id,
        email: me.email,
        role: me.role,
      });
      setStatus("authenticated");
    } catch (err) {
      if (err instanceof ApiError && err.isUnavailable) {
        setStatus("unavailable");
      } else {
        // Invalid/expired token → force re-auth.
        setToken(null);
        setPrincipal(null);
        setStatus("unauthenticated");
      }
    }
  }, []);

  React.useEffect(() => {
    // A 401 anywhere in the app clears the session.
    setUnauthorizedHandler(() => {
      setToken(null);
      setPrincipal(null);
      setStatus("unauthenticated");
    });
    restore();
    return () => setUnauthorizedHandler(null);
  }, [restore]);

  const login = React.useCallback(async (token: string) => {
    setToken(token);
    const me = await api.get<MeDto>("/auth/me"); // throws ApiError on bad token
    setPrincipal({
      userId: me.user_id,
      organizationId: me.organization_id,
      email: me.email,
      role: me.role,
    });
    setStatus("authenticated");
  }, []);

  const logout = React.useCallback(() => {
    setToken(null);
    setPrincipal(null);
    setStatus("unauthenticated");
  }, []);

  const value: AuthContextValue = {
    status,
    principal,
    login,
    logout,
    retry: restore,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
