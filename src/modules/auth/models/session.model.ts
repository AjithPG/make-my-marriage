import "server-only";
import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Database Design §3.2. The cookie holds the raw token; only its SHA-256 hash is stored.
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true },
    /** Sliding: last activity + 30 days, never past absoluteExpiresAt. */
    expiresAt: { type: Date, required: true },
    /** Creation + 90 days. */
    absoluteExpiresAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
    userAgent: String,
    ip: String,
  },
  { collection: "sessions", timestamps: true },
);

sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type Session = InferSchemaType<typeof sessionSchema>;
export type SessionDocument = HydratedDocument<Session>;

export const SessionModel =
  (models.Session as Model<Session> | undefined) ??
  model("Session", sessionSchema);
