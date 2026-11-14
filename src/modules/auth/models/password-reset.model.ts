import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Database Design §3.3
const passwordResetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true },
    /** Creation + 30 minutes. */
    expiresAt: { type: Date, required: true },
    usedAt: Date,
  },
  { collection: "passwordResets", timestamps: true },
);

passwordResetSchema.index({ tokenHash: 1 }, { unique: true });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordReset = InferSchemaType<typeof passwordResetSchema>;

export const PasswordResetModel =
  (models.PasswordReset as Model<PasswordReset> | undefined) ??
  model("PasswordReset", passwordResetSchema);
