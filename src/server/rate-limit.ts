import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { connectDb, isDuplicateKeyError } from "./db";
import { AppError } from "./errors";

/**
 * Fixed-window counters in MongoDB (API Design §5): Vercel instances share no
 * memory. Model and limiter live in one file (CLAUDE.md decision).
 */
const rateLimitSchema = new Schema(
  {
    /** e.g. `signup:ip:1.2.3.4` */
    key: { type: String, required: true },
    count: { type: Number, required: true },
    /** End of the window. */
    expiresAt: { type: Date, required: true },
  },
  { collection: "rateLimits", timestamps: true },
);

// Same indexes as migrations/20261118000000-signup-indexes.js.
rateLimitSchema.index({ key: 1 }, { unique: true });
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

type RateLimit = InferSchemaType<typeof rateLimitSchema>;

// One explicit type: a union of two Model types breaks query overloads.
const RateLimitModel: Model<RateLimit> =
  (models.RateLimit as Model<RateLimit> | undefined) ??
  model<RateLimit>("RateLimit", rateLimitSchema);

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

/** Counts one request for `key`; throws RATE_LIMITED (429) once it passes `limit` in the window. */
export async function rateLimit(options: RateLimitOptions): Promise<void> {
  await connectDb();
  const counter = await increment(options.key, options.windowMs);
  if (counter.count > options.limit) throw rateLimited(counter.expiresAt);
}

/**
 * For limits on failures only (e.g. failed logins): throws RATE_LIMITED if
 * `key` already reached `limit` in its window. Counts nothing; pair with
 * `recordAttempt()` after a failure.
 */
export async function assertUnderLimit({
  key,
  limit,
}: Pick<RateLimitOptions, "key" | "limit">): Promise<void> {
  await connectDb();
  const counter = await RateLimitModel.findOne({
    key,
    expiresAt: { $gt: new Date() },
  }).lean();
  if (counter && counter.count >= limit) throw rateLimited(counter.expiresAt);
}

/** Counts one attempt for `key` without checking the limit. */
export async function recordAttempt({
  key,
  windowMs,
}: Pick<RateLimitOptions, "key" | "windowMs">): Promise<void> {
  await connectDb();
  await increment(key, windowMs);
}

function rateLimited(windowEnd: Date): AppError {
  const retryAfter = Math.max(
    1,
    Math.ceil((windowEnd.getTime() - Date.now()) / 1000),
  );
  return new AppError("RATE_LIMITED", "Too many requests. Try again later.", {
    headers: { "Retry-After": String(retryAfter) },
  });
}

async function increment(
  key: string,
  windowMs: number,
  retried = false,
): Promise<{ count: number; expiresAt: Date }> {
  const now = new Date();

  // Count inside the current window. Always compare expiresAt: the TTL monitor
  // deletes expired counters only about once a minute.
  const current = await RateLimitModel.findOneAndUpdate(
    { key, expiresAt: { $gt: now } },
    { $inc: { count: 1 } },
    { returnDocument: "after" },
  ).lean();
  if (current) return current;

  // No open window: reset the expired counter, or insert a new one.
  try {
    const started = await RateLimitModel.findOneAndUpdate(
      { key, expiresAt: { $lte: now } },
      { $set: { count: 1, expiresAt: new Date(now.getTime() + windowMs) } },
      { upsert: true, returnDocument: "after" },
    ).lean();
    return started;
  } catch (error) {
    // Another request opened the window first: count against it instead.
    if (isDuplicateKeyError(error) && !retried) {
      return increment(key, windowMs, true);
    }
    throw error;
  }
}
