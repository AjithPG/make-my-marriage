import "server-only";
import { cookies } from "next/headers";
import { appEnv } from "../env";

const SESSION_COOKIE = "mm_session";

export async function readSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** httpOnly (no JavaScript access), Secure in production, SameSite=Lax, whole site. */
export async function setSessionCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: appEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
  });
}

/** Same name, path and flags as when set, with Max-Age=0 so the browser drops it. */
export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: appEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
