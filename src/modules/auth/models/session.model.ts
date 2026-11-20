import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Database Design §3.2 — only the fields login needs. Sliding expiry adds
// lastSeenAt and absoluteExpiresAt later.
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** HMAC-SHA256 of the cookie token with TOKEN_PEPPER (server/auth/token.ts). */
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { collection: "sessions", timestamps: true },
);

// Same indexes as migrations/20261120000000-login-indexes.js.
sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type Session = InferSchemaType<typeof sessionSchema>;

// One explicit type: a union of two Model types breaks query overloads.
export const SessionModel: Model<Session> =
  (models.Session as Model<Session> | undefined) ??
  model<Session>("Session", sessionSchema);
