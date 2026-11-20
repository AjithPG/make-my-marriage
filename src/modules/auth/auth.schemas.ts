// Shared by the auth forms (client) and, from Step 7, the auth API routes.
// No `server-only` here and nothing but `zod` imported (CLAUDE.md exception).
//
// Each `error` is a stable key, not display text: forms look it up under
// `Auth.errors` in messages/en.json, so the copy stays in one place.
import { z } from "zod";

export const NAME_MAX = 80;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export type AuthErrorKey =
  | "nameRequired"
  | "emailInvalid"
  | "passwordRequired"
  | "passwordTooShort"
  | "passwordTooLong"
  // Set by the server only (not checkable in the browser):
  | "passwordCommon"
  | "emailTaken";

const name = z
  .string()
  .trim()
  .min(1, { error: "nameRequired" satisfies AuthErrorKey })
  .max(NAME_MAX, { error: "nameRequired" satisfies AuthErrorKey });

/** Trimmed and lowercased, so "Meera@Example.com " and "meera@example.com" are one account. */
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "emailInvalid" satisfies AuthErrorKey }));

const newPassword = z
  .string()
  .min(PASSWORD_MIN, { error: "passwordTooShort" satisfies AuthErrorKey })
  .max(PASSWORD_MAX, { error: "passwordTooLong" satisfies AuthErrorKey });

/** Strict: unknown fields are rejected (API Design §2). */
export const signupSchema = z.strictObject({
  name,
  email,
  password: newPassword,
});

/** Login doesn't apply the length rules, so it never hints at what a valid password looks like. */
export const loginSchema = z.object({
  email,
  password: z
    .string()
    .min(1, { error: "passwordRequired" satisfies AuthErrorKey })
    .max(PASSWORD_MAX, { error: "passwordTooLong" satisfies AuthErrorKey }),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
