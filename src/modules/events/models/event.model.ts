import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Database Design §3.8. Times are wall-clock HH:mm in the wedding's time zone.
export const EVENT_PRESETS = [
  "engagement",
  "mehendi",
  "haldi",
  "wedding",
  "reception",
  "custom",
] as const;

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

const venueSchema = new Schema(
  {
    name: String,
    address: String,
    /** Must be a Google Maps URL (validated by Zod at the API). */
    mapsUrl: String,
  },
  { _id: false },
);

const eventSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true },
    preset: { type: String, enum: EVENT_PRESETS, required: true },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    date: { type: Date, required: true },
    startTime: { type: String, required: true, match: HH_MM },
    endTime: { type: String, match: HH_MM },
    /** Free text, e.g. "10:30 – 11:15 AM"; shown prominently. */
    muhurtham: String,
    venue: venueSchema,
    description: { type: String, maxlength: 1000 },
    youtubeUrl: String,
    youtubeVideoId: String,
    order: { type: Number, required: true },
  },
  { collection: "events", timestamps: true },
);

eventSchema.index({ weddingId: 1, date: 1, startTime: 1 });

export type WeddingEvent = InferSchemaType<typeof eventSchema>;

export const EventModel =
  (models.Event as Model<WeddingEvent> | undefined) ??
  model("Event", eventSchema);
