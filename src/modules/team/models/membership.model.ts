import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Database Design §3.6
export const ROLES = ["admin", "manager"] as const;

const membershipSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ROLES, required: true },
    /** Exactly one `true` per wedding; only the creator can delete the wedding. */
    isCreator: { type: Boolean, required: true, default: false },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { collection: "memberships", timestamps: true },
);

membershipSchema.index({ weddingId: 1, userId: 1 }, { unique: true });
membershipSchema.index({ userId: 1 });

export type Membership = InferSchemaType<typeof membershipSchema>;

export const MembershipModel =
  (models.Membership as Model<Membership> | undefined) ??
  model("Membership", membershipSchema);
