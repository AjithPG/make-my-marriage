import { assertCronAuth } from "@/server/cron";
import { handler, ok } from "@/server/http";

// Batch deletes of R2 prefixes can take a while; stay within the plan's limit.
export const maxDuration = 300;

/**
 * Daily cleanup, 03:00 IST (vercel.json). Must be idempotent: Vercel may
 * deliver a run late or more than once. Jobs are added with their features
 * (System Design §4.8): stale pending photos, released photo slots, R2 files
 * of deleted weddings, used or expired team invites older than 30 days.
 */
export const GET = handler({}, async ({ req }) => {
  assertCronAuth(req);
  return ok({ jobs: [] });
});
