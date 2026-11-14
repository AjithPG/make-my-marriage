import "server-only";
import { z } from "zod";

/**
 * Environment variables, validated with Zod.
 *
 * Each group is parsed lazily on first use, so `next build` and pages that
 * don't need an integration never fail because its variables are missing,
 * while any code that does need them fails fast with a clear message.
 */

function parseGroup<T extends z.ZodType>(name: string, schema: T) {
  let cached: z.infer<T> | undefined;
  return (): z.infer<T> => {
    if (cached) return cached;
    const result = schema.safeParse(process.env);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      throw new Error(`Invalid ${name} environment variables:\n${issues}`);
    }
    cached = result.data;
    return cached;
  };
}

const url = z.url({ protocol: /^https?$/ });

/** Core settings every server request needs. */
export const appEnv = parseGroup(
  "app",
  z.object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_URL: url.transform((u) => new URL(u).origin),
    // Set by Vercel. See https://vercel.com/docs/environment-variables/system-environment-variables
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
    VERCEL_URL: z.string().optional(),
    VERCEL_BRANCH_URL: z.string().optional(),
  }),
);

export const dbEnv = parseGroup(
  "database",
  z.object({
    MONGODB_URI: z
      .string()
      .regex(
        /^mongodb(\+srv)?:\/\//,
        "Must be a mongodb:// or mongodb+srv:// URI",
      ),
  }),
);

export const r2Env = parseGroup(
  "R2",
  z.object({
    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET: z.string().min(1),
    R2_PUBLIC_URL: url.transform((u) => u.replace(/\/+$/, "")),
  }),
);

export const emailEnv = parseGroup(
  "email",
  z.object({
    RESEND_API_KEY: z.string().startsWith("re_"),
    EMAIL_FROM: z.string().min(3),
  }),
);

export const cronEnv = parseGroup(
  "cron",
  z.object({
    CRON_SECRET: z.string().min(16, "Use at least 16 random characters"),
  }),
);
