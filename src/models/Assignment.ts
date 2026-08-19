import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const ASSIGNMENT_STATUSES = ["draft", "published"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

const assignmentSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true },
    dueAt: { type: Date, required: true },
    maxScore: { type: Number, required: true, default: 100 },
    // Optional teacher-provided reference material — S3 object key, signed on read.
    attachmentKey: { type: String },
    status: { type: String, enum: ASSIGNMENT_STATUSES, default: "draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

assignmentSchema.index({ courseId: 1, status: 1 });
assignmentSchema.index({ instituteId: 1, teacherId: 1 });

export type Assignment = InferSchemaType<typeof assignmentSchema>;

export default mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);
