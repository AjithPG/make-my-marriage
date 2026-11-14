import "server-only";

/** Stable machine-readable error codes (API Design §2) mapped to HTTP status. */
export const ERROR_STATUS = {
  VALIDATION_FAILED: 400,
  BAD_REQUEST: 400,
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  INVALID_PASSWORD: 401,
  FORBIDDEN: 403,
  CSRF_ORIGIN_MISMATCH: 403,
  CRON_UNAUTHORIZED: 403,
  NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  SLUG_TAKEN: 409,
  INVITE_USED: 409,
  ALREADY_MEMBER: 409,
  LAST_ADMIN: 409,
  INVITE_EXPIRED: 410,
  RESET_LINK_EXPIRED: 410,
  PAYLOAD_TOO_LARGE: 413,
  LIMIT_REACHED: 422,
  NOT_PUBLISHABLE: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export interface ErrorDetail {
  path: string;
  message: string;
}

interface AppErrorOptions {
  details?: ErrorDetail[];
  /** Extra response headers, e.g. `Retry-After` for RATE_LIMITED. */
  headers?: Record<string, string>;
  cause?: unknown;
}

/** Throw from anywhere on the server; handler() turns it into the API error format. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: ErrorDetail[];
  readonly headers?: Record<string, string>;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.details = options.details;
    this.headers = options.headers;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
