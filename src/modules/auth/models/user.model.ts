import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Database Design §3.1 — only the fields sign-up needs. Later features add
// their own fields (login: lastLoginAt, password change: passwordChangedAt,
// notifications: notificationPrefs).
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 80,
    },
  },
  { collection: "users", timestamps: true },
);

// Same index as migrations/20261118000000-signup-indexes.js.
userSchema.index({ email: 1 }, { unique: true });

export type User = InferSchemaType<typeof userSchema>;

// One explicit type: a union of two Model types breaks query overloads.
export const UserModel: Model<User> =
  (models.User as Model<User> | undefined) ?? model<User>("User", userSchema);
