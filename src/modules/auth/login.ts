import "server-only";
import { verifyPassword } from "@/server/auth/password";
import { connectDb } from "@/server/db";
import { AppError } from "@/server/errors";
import { assertUnderLimit, recordAttempt } from "@/server/rate-limit";
import type { LoginInput } from "./auth.schemas";
import { UserModel } from "./models/user.model";
import { createSession, deleteSession, type NewSession } from "./session";

/** API Design §5: 5 failed logins per 15 minutes, per email and per IP separately. */
const FAILED_LOGIN_LIMIT = 5;
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Argon2id hash of a random throwaway string, same settings as real hashes.
 * Unknown emails are checked against it, so they take as long as a wrong
 * password and the response time doesn't reveal which emails have accounts.
 */
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$5d+csTYExm2n7ZI2TpctCg$ePnmQlrYfZx9/nrZaKU1LdFohH7ZekOo82xBi99fVBM";

export type LoggedInUser = { id: string; name: string; email: string };

type LoginContext = {
  ip: string;
  /** Token from an mm_session cookie the browser already had; that session is ended. */
  currentToken?: string;
};

/** System Design §4.2. `input` is already validated by `loginSchema`. */
export async function login(
  input: LoginInput,
  { ip, currentToken }: LoginContext,
): Promise<{ user: LoggedInUser; session: NewSession }> {
  const limitKeys = [`login:email:${input.email}`, `login:ip:${ip}`];
  for (const key of limitKeys) {
    await assertUnderLimit({ key, limit: FAILED_LOGIN_LIMIT });
  }

  await connectDb();
  const user = await UserModel.findOne(
    { email: input.email },
    { name: 1, email: 1, passwordHash: 1 },
  ).lean();

  const passwordOk = await verifyPassword(
    user?.passwordHash ?? DUMMY_HASH,
    input.password,
  );

  if (!user || !passwordOk) {
    await Promise.all(
      limitKeys.map((key) =>
        recordAttempt({ key, windowMs: FAILED_LOGIN_WINDOW_MS }),
      ),
    );
    // Same error for unknown email and wrong password (API Design §2).
    throw new AppError(
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  }

  if (currentToken) await deleteSession(currentToken);
  const session = await createSession(user._id);
  await UserModel.updateOne(
    { _id: user._id },
    { $set: { lastLoginAt: new Date() } },
  );

  return {
    user: { id: user._id.toString(), name: user.name, email: user.email },
    session,
  };
}
