import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Database Design §3.12
const todoSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    dueDate: Date,
    /** Must be a member of the wedding (checked by the service). */
    assigneeId: { type: Schema.Types.ObjectId, ref: "User" },
    eventId: { type: Schema.Types.ObjectId, ref: "Event" },
    done: { type: Boolean, required: true, default: false },
    doneAt: Date,
    /** Set for items from the preloaded Kerala checklist. */
    templateKey: String,
    order: { type: Number, required: true },
  },
  { collection: "todos", timestamps: true },
);

todoSchema.index({ weddingId: 1, done: 1, dueDate: 1 });

export type Todo = InferSchemaType<typeof todoSchema>;

export const TodoModel =
  (models.Todo as Model<Todo> | undefined) ?? model("Todo", todoSchema);
