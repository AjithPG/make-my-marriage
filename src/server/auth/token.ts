import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * Opaque random tokens for session cookies, password-reset links and team
 * invites. The raw token goes to the user; only `hashToken(token)` is stored.
 */
export function generateToken(): string {
  return randomBytes(32).toString("base64url"); // 256 bits
}

/** SHA-256 hex digest. A plain hash is enough: tokens are 256-bit random. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
