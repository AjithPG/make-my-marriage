import "server-only";
import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Database Design §3.1
const notificationPrefsSchema = new Schema(
  {
    eventReminders: { type: Boolean, default: true },
    todoReminders: { type: Boolean, default: true },
    activity: { type: Boolean, default: true },
  },
  { _id: false },
);

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
    passwordChangedAt: Date,
    notificationPrefs: {
      type: notificationPrefsSchema,
      required: true,
      default: () => ({}),
    },
    lastLoginAt: Date,
  },
  { collection: "users", timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;

export const UserModel =
  (models.User as Model<User> | undefined) ?? model("User", userSchema);
