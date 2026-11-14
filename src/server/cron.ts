import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cronEnv } from "./env";
import { AppError } from "./errors";

/**
 * Vercel Cron calls cron routes with `Authorization: Bearer <CRON_SECRET>`.
 * Throws CRON_UNAUTHORIZED (403) for anything else.
 */
export function assertCronAuth(req: Request): void {
  const expected = Buffer.from(`Bearer ${cronEnv().CRON_SECRET}`);
  const actual = Buffer.from(req.headers.get("authorization") ?? "");
  const valid =
    actual.length === expected.length && timingSafeEqual(actual, expected);
  if (!valid) {
    throw new AppError("CRON_UNAUTHORIZED", "Invalid cron secret.");
  }
}
