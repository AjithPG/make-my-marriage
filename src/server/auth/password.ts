import "server-only";
import { hash, verify, type Algorithm, type Options } from "@node-rs/argon2";

/**
 * Argon2id with the OWASP baseline (19 MiB, 2 passes, 1 thread). Stated
 * explicitly so a library default change can't silently alter new hashes.
 * Length and common-password rules are enforced by Zod in the auth module.
 */
const ARGON2_OPTIONS: Options = {
  algorithm: 2 as Algorithm, // Algorithm.Argon2id (const enum, so not importable as a value)
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/** Never throws for a malformed stored hash; returns false instead. */
export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
