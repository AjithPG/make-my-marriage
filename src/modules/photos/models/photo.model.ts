import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Database Design §3.11
export const PHOTO_STATUSES = ["pending", "ready", "failed"] as const;

const photoSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true },
    /** null = General */
    eventId: { type: Schema.Types.ObjectId, ref: "Event", default: null },
    status: {
      type: String,
      enum: PHOTO_STATUSES,
      required: true,
      default: "pending",
    },
    /** originals/<weddingId>/<uuid>: private, deleted after processing. */
    originalKey: { type: String, required: true },
    /** media/<weddingId>/<uuid>.webp and …_thumb.webp on the public media domain. */
    imageKey: String,
    thumbKey: String,
    width: Number,
    height: Number,
    bytes: Number,
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { collection: "photos", timestamps: true },
);

photoSchema.index({ weddingId: 1, eventId: 1, createdAt: -1 });
photoSchema.index({ status: 1, createdAt: 1 });

export type Photo = InferSchemaType<typeof photoSchema>;

export const PhotoModel =
  (models.Photo as Model<Photo> | undefined) ?? model("Photo", photoSchema);
