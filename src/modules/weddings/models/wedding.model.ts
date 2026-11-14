import "server-only";
import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Database Design §3.5
export const WEDDING_STATUSES = [
  "draft",
  "published",
  "unpublished",
  "deleting",
] as const;

/** Editable content; `published` is a snapshot of this taken at publish time. */
const contentSchema = new Schema(
  {
    story: String,
    brideFamily: String,
    groomFamily: String,
    /** R2 key under media/<weddingId>/ */
    couplePhotoKey: String,
    contactNote: String,
  },
  { _id: false },
);

const previousSlugSchema = new Schema(
  {
    slug: { type: String, required: true },
    redirectUntil: { type: Date, required: true },
  },
  { _id: false },
);

const weddingSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 80,
      match: /^[a-z0-9]+(-[a-z0-9]+)*$/,
    },
    previousSlugs: { type: [previousSlugSchema], default: [] },
    brideName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    groomName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    weddingDate: { type: Date, required: true },
    timeZone: { type: String, required: true, default: "Asia/Kolkata" },
    draft: { type: contentSchema, required: true, default: () => ({}) },
    published: { type: contentSchema, default: undefined },
    status: {
      type: String,
      enum: WEDDING_STATUSES,
      required: true,
      default: "draft",
    },
    publishedAt: Date,
    deletingAt: Date,
    galleryVisible: { type: Boolean, required: true, default: false },
    searchIndexable: { type: Boolean, required: true, default: false },
    /** Maintained with $inc to enforce the 500-photo cap. */
    photoCount: { type: Number, required: true, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { collection: "weddings", timestamps: true },
);

weddingSchema.index({ slug: 1 }, { unique: true });
weddingSchema.index({ "previousSlugs.slug": 1 });
weddingSchema.index(
  { status: 1 },
  { partialFilterExpression: { status: "deleting" } },
);

export type Wedding = InferSchemaType<typeof weddingSchema>;
export type WeddingDocument = HydratedDocument<Wedding>;

export const WeddingModel =
  (models.Wedding as Model<Wedding> | undefined) ??
  model("Wedding", weddingSchema);
