import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { ROLES } from "./membership.model";

// Database Design §3.7. `admin` = co-admin invite.
const teamInviteSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true },
    role: { type: String, enum: ROLES, required: true },
    tokenHash: { type: String, required: true },
    /** Creation + 7 days. */
    expiresAt: { type: Date, required: true },
    usedAt: Date,
    usedBy: { type: Schema.Types.ObjectId, ref: "User" },
    revokedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { collection: "teamInvites", timestamps: true },
);

teamInviteSchema.index({ tokenHash: 1 }, { unique: true });
teamInviteSchema.index({ weddingId: 1, createdAt: -1 });

export type TeamInvite = InferSchemaType<typeof teamInviteSchema>;

export const TeamInviteModel =
  (models.TeamInvite as Model<TeamInvite> | undefined) ??
  model("TeamInvite", teamInviteSchema);
