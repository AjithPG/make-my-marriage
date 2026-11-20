import "server-only";
import type { Types } from "mongoose";
import { readSessionToken } from "@/server/auth/cookie";
import { createToken, hashToken } from "@/server/auth/token";
import { connectDb } from "@/server/db";
import { SessionModel } from "./models/session.model";
import { UserModel } from "./models/user.model";

/** Database Design §7: sessions last 30 days (sliding expiry comes later). */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type NewSession = {
  /** Goes in the mm_session cookie; only its hash is stored. */
  token: string;
  expiresAt: Date;
};

export async function createSession(
  userId: Types.ObjectId,
): Promise<NewSession> {
  const token = createToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await connectDb();
  await SessionModel.create({ userId, tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt };
}

export async function deleteSession(token: string): Promise<void> {
  await connectDb();
  await SessionModel.deleteOne({ tokenHash: hashToken(token) });
}

export type CurrentUser = { id: string; name: string; email: string };

/**
 * For server pages (API Design §6): the logged-in user from the mm_session
 * cookie, or null. Uses cookies() and the current time, so call it inside
 * <Suspense> after `await connection()`.
 */
export async function getSession(): Promise<{ user: CurrentUser } | null> {
  const token = await readSessionToken();
  if (!token) return null;

  await connectDb();
  // Compare expiresAt too: the TTL monitor deletes expired rows only about once a minute.
  const session = await SessionModel.findOne(
    { tokenHash: hashToken(token), expiresAt: { $gt: new Date() } },
    { userId: 1 },
  ).lean();
  if (!session) return null;

  const user = await UserModel.findById(session.userId, {
    name: 1,
    email: 1,
  }).lean();
  if (!user) return null;

  return {
    user: { id: user._id.toString(), name: user.name, email: user.email },
  };
}
