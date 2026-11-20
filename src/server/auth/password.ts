import "server-only";
import { hash, verify } from "@node-rs/argon2";

/**
 * OWASP minimum for Argon2id: 19 MiB memory, 2 passes, 1 thread.
 * Argon2id is the library default. Changing these only affects new hashes:
 * the settings are stored in each hash string, so old ones still verify.
 */
const ARGON2_OPTIONS = {
  memoryCost: 19_456, // KiB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/** Reads the settings from `passwordHash` itself, so old hashes keep working. */
export function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  return verify(passwordHash, password);
}
