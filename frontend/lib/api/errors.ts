/** Typed API error surface shared by the client, services, and UI. */

export type ApiErrorKind =
  | "bad_request" // 400
  | "unauthorized" // 401
  | "forbidden" // 403
  | "not_found" // 404
  | "conflict" // 409
  | "validation" // 422
  | "rate_limited" // 429
  | "server" // 500
  | "unavailable" // 503 / network / backend down
  | "timeout"
  | "unknown";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly kind: ApiErrorKind;
  readonly details: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.kind = kindFromStatus(status);
  }

  get isAuth(): boolean {
    return this.kind === "unauthorized";
  }
  get isForbidden(): boolean {
    return this.kind === "forbidden";
  }
  get isUnavailable(): boolean {
    return this.kind === "unavailable" || this.kind === "timeout";
  }
}

export function kindFromStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return "bad_request";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 422:
      return "validation";
    case 429:
      return "rate_limited";
    case 503:
      return "unavailable";
    default:
      return status >= 500 ? "server" : "unknown";
  }
}

/** Human-friendly, non-leaky message for an error kind. */
export function friendlyMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.kind) {
      case "unauthorized":
        return "Your session has expired. Please sign in again.";
      case "forbidden":
        return "You don't have permission to perform this action.";
      case "not_found":
        return "The requested resource was not found.";
      case "validation":
      case "bad_request":
        return err.message || "The request was invalid.";
      case "rate_limited":
        return "Too many requests. Please slow down and try again shortly.";
      case "unavailable":
      case "timeout":
        return "Backend unavailable. Check that the API server is running.";
      case "server":
        return "The server encountered an error. Please try again.";
      default:
        return err.message || "Something went wrong.";
    }
  }
  return "Something went wrong.";
}
