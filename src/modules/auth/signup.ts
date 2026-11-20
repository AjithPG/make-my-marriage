import "server-only";
import { hashPassword } from "@/server/auth/password";
import { connectDb, isDuplicateKeyError } from "@/server/db";
import { AppError } from "@/server/errors";
import type { AuthErrorKey, SignupInput } from "./auth.schemas";
import { isCommonPassword } from "./common-passwords";
import { UserModel } from "./models/user.model";

export type SignedUpUser = { id: string; name: string; email: string };

/**
 * Creates an account (System Design §4.2). No session: the person is sent to
 * the login page next. `input` is already validated by `signupSchema`.
 */
export async function signUp(input: SignupInput): Promise<SignedUpUser> {
  if (isCommonPassword(input.password)) {
    throw new AppError("VALIDATION_FAILED", "Some fields are invalid.", {
      details: [
        {
          path: "password",
          message: "passwordCommon" satisfies AuthErrorKey,
        },
      ],
    });
  }

  const passwordHash = await hashPassword(input.password);
  await connectDb();

  try {
    // No pre-check for the email: the unique index rejects duplicates,
    // including two sign-ups racing each other.
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
    return { id: user._id.toString(), name: user.name, email: user.email };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        "EMAIL_TAKEN",
        "An account with this email already exists.",
      );
    }
    throw error;
  }
}
