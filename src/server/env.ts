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
