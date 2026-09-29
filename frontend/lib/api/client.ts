/**
 * Centralized API client.
 *
 * The single place that talks to FastAPI. Handles base URL, auth header, JSON,
 * request-id, timeout, envelope unwrapping, and typed error mapping. Components
 * never call fetch() directly — they go through services → this client.
 */
import { ApiError } from "./errors";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

const TOKEN_KEY = "ancp.token";
const DEFAULT_TIMEOUT_MS = 30_000;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

/** Listeners notified on 401 so the AuthProvider can clear the session. */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null): void {
  onUnauthorized = fn;
}

export interface PageMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

interface RequestOptions {
  method?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** For multipart uploads. */
  formData?: FormData;
  timeoutMs?: number;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(
    BASE_URL + (path.startsWith("/") ? path : `/${path}`)
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

function requestId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `req-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

async function request<T>(
  path: string,
  opts: RequestOptions = {}
): Promise<{ data: T; meta: PageMeta | Record<string, unknown> }> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  );

  const headers: Record<string, string> = { "x-request-id": requestId() };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (opts.formData) {
    payload = opts.formData; // browser sets multipart boundary
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? "GET",
      headers,
      body: payload,
      signal: opts.signal ?? controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    // Network failure / abort → backend unavailable (or timeout).
    const aborted = (err as Error)?.name === "AbortError";
    throw new ApiError(
      aborted ? 408 : 503,
      aborted ? "timeout" : "backend_unavailable",
      aborted ? "Request timed out" : "Backend unavailable"
    );
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 204) {
    return { data: undefined as T, meta: {} };
  }

  let json: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    const errObj =
      (json as { error?: { code?: string; message?: string; details?: Record<string, unknown> } })
        ?.error ?? {};
    throw new ApiError(
      res.status,
      errObj.code ?? "error",
      errObj.message ?? res.statusText ?? "Request failed",
      errObj.details ?? {}
    );
  }

  const envelope = (json ?? {}) as { data?: T; meta?: Record<string, unknown> };
  return {
    data: (envelope.data ?? (json as T)) as T,
    meta: envelope.meta ?? {},
  };
}

export const api = {
  async get<T>(path: string, query?: RequestOptions["query"]): Promise<T> {
    return (await request<T>(path, { query })).data;
  },
  /** GET returning both data + pagination meta. */
  async getPaged<T>(
    path: string,
    query?: RequestOptions["query"]
  ): Promise<{ data: T; meta: PageMeta }> {
    const r = await request<T>(path, { query });
    return { data: r.data, meta: r.meta as PageMeta };
  },
  async post<T>(path: string, body?: unknown): Promise<T> {
    return (await request<T>(path, { method: "POST", body })).data;
  },
  async patch<T>(path: string, body?: unknown): Promise<T> {
    return (await request<T>(path, { method: "PATCH", body })).data;
  },
  async del<T>(path: string): Promise<T> {
    return (await request<T>(path, { method: "DELETE" })).data;
  },
  async upload<T>(path: string, formData: FormData): Promise<T> {
    return (await request<T>(path, { method: "POST", formData, timeoutMs: 60_000 }))
      .data;
  },
};

export { BASE_URL };
