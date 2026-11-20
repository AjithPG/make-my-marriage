import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { authEnv } from "../env";

/** 256-bit random token, base64url (System Design §5). Goes in the cookie, never in the database. */
export function createToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * HMAC-SHA256(token, TOKEN_PEPPER): the only form of a token the database sees.
 * Without the pepper, database access alone can't produce a valid session row.
 */
export function hashToken(token: string): string {
  return createHmac("sha256", authEnv().TOKEN_PEPPER)
    .update(token)
    .digest("hex");
}
