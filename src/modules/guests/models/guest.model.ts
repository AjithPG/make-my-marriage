import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Database Design §3.9. No phone, email or address fields, by design.
const guestSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    /** Lowercased copy of `name` for prefix search and sort. */
    nameLower: { type: String, required: true },
    /** e.g. "Rajan Uncle & Family"; falls back to `name`. */
    inviteName: { type: String, trim: true, maxlength: 100 },
    group: { type: String, trim: true, maxlength: 40 },
    eventIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Event" }],
      default: [],
    },
    invited: { type: Boolean, required: true, default: false },
    invitedAt: Date,
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, maxlength: 500 },
  },
  { collection: "guests", timestamps: true },
);

guestSchema.index({ weddingId: 1, nameLower: 1 });
guestSchema.index({ weddingId: 1, invited: 1 });
guestSchema.index({ weddingId: 1, group: 1 });
guestSchema.index({ weddingId: 1, eventIds: 1 });

export type Guest = InferSchemaType<typeof guestSchema>;

export const GuestModel =
  (models.Guest as Model<Guest> | undefined) ?? model("Guest", guestSchema);
