import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Database Design §3.10. One document per wedding; designs live in code.
const fieldsSchema = new Schema(
  {
    headline: String,
    coupleLine: String,
    dateLine: String,
    venueLine: String,
    body: String,
  },
  { _id: false },
);

const imageKeysSchema = new Schema(
  {
    /** 1080 × 1350 PNG */
    download: String,
    /** 1200 × 630 PNG (Open Graph / WhatsApp preview) */
    preview: String,
  },
  { _id: false },
);

const invitationSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true },
    designId: { type: String, required: true },
    fields: { type: fieldsSchema, required: true, default: () => ({}) },
    /** Placeholders: {inviteName} {bride} {groom} {date} {link} */
    messageTemplate: { type: String, required: true, maxlength: 1000 },
    /** Incremented on each render; part of the R2 key for cache busting. */
    version: { type: Number, required: true, default: 0 },
    imageKeys: imageKeysSchema,
    renderedAt: Date,
  },
  { collection: "invitations", timestamps: true },
);

invitationSchema.index({ weddingId: 1 }, { unique: true });

export type Invitation = InferSchemaType<typeof invitationSchema>;

export const InvitationModel =
  (models.Invitation as Model<Invitation> | undefined) ??
  model("Invitation", invitationSchema);
