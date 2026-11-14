import "server-only";
import { cookies } from "next/headers";

/** Also referenced by src/proxy.ts (which can't import server-only code). */
export const SESSION_COOKIE = "mm_session";

/** 30 days; the session document's expiresAt is the real limit. */
export const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

const baseOptions = {
  httpOnly: true,
  // Safari refuses Secure cookies on http://localhost.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

/** Raw session token from the request, if any. Never trust it without a DB lookup. */
export async function readSessionCookie(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function setSessionCookie(
  token: string,
  maxAge = SESSION_COOKIE_MAX_AGE,
): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, { ...baseOptions, maxAge });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { ...baseOptions, maxAge: 0 });
}
