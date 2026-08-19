import mongoose, { Schema, type InferSchemaType } from "mongoose";

const moduleSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    lessonOrder: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

moduleSchema.index({ courseId: 1, order: 1 });

export type Module = InferSchemaType<typeof moduleSchema>;

export default mongoose.models.Module || mongoose.model("Module", moduleSchema);
