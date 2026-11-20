import "server-only";
import { randomUUID } from "node:crypto";
import { connection } from "next/server";
import { z } from "zod";
import { appEnv } from "./env";
import { AppError, isAppError, type ErrorDetail } from "./errors";

/** JSON bodies over this size are rejected with 413 (API Design §5). */
const MAX_JSON_BYTES = 100 * 1024;

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

type Schema = z.ZodType;
type Infer<S> = S extends Schema ? z.infer<S> : undefined;

export interface HandlerConfig<
  B extends Schema | undefined,
  Q extends Schema | undefined,
  P extends Schema | undefined,
> {
  body?: B;
  query?: Q;
  params?: P;
}

export interface HandlerContext<B, Q, P> {
  req: Request;
  body: B;
  query: Q;
  params: P;
  requestId: string;
}

/** Second argument Next.js passes to route handlers. */
interface RouteContext {
  params: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Wraps every route handler (System Design §3):
 * Origin check on non-GET, Zod validation of body/query/params,
 * AppError → error JSON, X-Request-Id and Cache-Control: no-store.
 */
export function handler<
  B extends Schema | undefined = undefined,
  Q extends Schema | undefined = undefined,
  P extends Schema | undefined = undefined,
>(
  config: HandlerConfig<B, Q, P>,
  fn: (ctx: HandlerContext<Infer<B>, Infer<Q>, Infer<P>>) => Promise<Response>,
) {
  return async (req: Request, routeCtx?: RouteContext): Promise<Response> => {
    // API responses are never prerendered or cached.
    await connection();
    const requestId = `req_${randomUUID().replaceAll("-", "").slice(0, 16)}`;

    let response: Response;
    try {
      if (!SAFE_METHODS.has(req.method)) assertSameOrigin(req);

      const body = (
        config.body ? parse(config.body, await readJson(req)) : undefined
      ) as Infer<B>;
      const query = (
        config.query
          ? parse(
              config.query,
              Object.fromEntries(new URL(req.url).searchParams),
            )
          : undefined
      ) as Infer<Q>;
      const params = (
        config.params
          ? parse(config.params, (await routeCtx?.params) ?? {})
          : undefined
      ) as Infer<P>;

      response = await fn({ req, body, query, params, requestId });
    } catch (error) {
      response = errorResponse(error, requestId);
    }

    response.headers.set("X-Request-Id", requestId);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
}

// ---------- response helpers ----------

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ data }, init);
}

export function created<T>(data: T): Response {
  return Response.json({ data }, { status: 201 });
}

/**
 * Client IP for rate-limit keys. On Vercel `x-real-ip` is set by the platform;
 * locally there is usually none, so every request shares the "unknown" key.
 */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

// ---------- internals ----------

function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (origin !== appEnv().APP_URL) {
    throw new AppError("CSRF_ORIGIN_MISMATCH", "Request origin not allowed.");
  }
}

async function readJson(req: Request): Promise<unknown> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_JSON_BYTES) throw tooLarge();

  const text = await req.text();
  if (Buffer.byteLength(text) > MAX_JSON_BYTES) throw tooLarge();
  if (text.length === 0) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("BAD_REQUEST", "Request body must be valid JSON.");
  }
}

function tooLarge() {
  return new AppError("PAYLOAD_TOO_LARGE", "Request body is too large.");
}

function parse<S extends Schema>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw validationError(result.error);
  return result.data;
}

function validationError(error: z.ZodError): AppError {
  const details: ErrorDetail[] = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  return new AppError("VALIDATION_FAILED", "Some fields are invalid.", {
    details,
  });
}

function errorResponse(error: unknown, requestId: string): Response {
  const appError = isAppError(error)
    ? error
    : error instanceof z.ZodError
      ? validationError(error)
      : null;

  if (!appError) {
    // Logger is deferred; console output is the log for now.
    console.error(`[${requestId}] Unhandled error`, error);
    return Response.json(
      {
        error: {
          code: "INTERNAL",
          message: "Something went wrong.",
          requestId,
        },
      },
      { status: 500 },
    );
  }

  return Response.json(
    {
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details ? { details: appError.details } : {}),
        requestId,
      },
    },
    { status: appError.status, headers: appError.headers },
  );
}
