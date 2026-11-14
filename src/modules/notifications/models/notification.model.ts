import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Database Design §3.13
export const NOTIFICATION_TYPES = [
  "eventReminder",
  "todoDue",
  "todoOverdue",
  "eventChanged",
  "photosUploaded",
  "memberJoined",
] as const;

export const NOTIFICATION_REF_TYPES = [
  "event",
  "todo",
  "photo",
  "membership",
] as const;

/** Reminder thresholds; activity notifications have none. */
export const NOTIFICATION_THRESHOLDS = [
  "7d",
  "3d",
  "1d",
  "due",
  "overdue",
] as const;

const READ_RETENTION_SECONDS = 90 * 24 * 60 * 60;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    refType: { type: String, enum: NOTIFICATION_REF_TYPES, required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    threshold: { type: String, enum: NOTIFICATION_THRESHOLDS },
    message: { type: String, required: true },
    read: { type: Boolean, required: true, default: false },
    readAt: Date,
  },
  { collection: "notifications", timestamps: true },
);

// Idempotent reminders. Partial so repeated activity rows (no threshold) don't collide.
notificationSchema.index(
  { userId: 1, refId: 1, type: 1, threshold: 1 },
  { unique: true, partialFilterExpression: { threshold: { $exists: true } } },
);
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
// Index 27: read notifications expire 90 days after being read.
notificationSchema.index(
  { readAt: 1 },
  {
    expireAfterSeconds: READ_RETENTION_SECONDS,
    partialFilterExpression: { read: true },
  },
);

export type Notification = InferSchemaType<typeof notificationSchema>;

export const NotificationModel =
  (models.Notification as Model<Notification> | undefined) ??
  model("Notification", notificationSchema);
