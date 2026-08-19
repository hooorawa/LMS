import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const STUDENT_FOLLOW_UP_TYPES = ["attendance", "coursework", "academic", "behavior", "general"] as const;
export const STUDENT_FOLLOW_UP_STATUSES = ["open", "resolved"] as const;

const studentFollowUpSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", default: null },
    type: { type: String, enum: STUDENT_FOLLOW_UP_TYPES, default: "general" },
    status: { type: String, enum: STUDENT_FOLLOW_UP_STATUSES, default: "open" },
    note: { type: String, required: true, trim: true },
    nextActionAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

studentFollowUpSchema.index({ instituteId: 1, studentId: 1, createdAt: -1 });
studentFollowUpSchema.index({ instituteId: 1, createdBy: 1, status: 1 });

export type StudentFollowUp = InferSchemaType<typeof studentFollowUpSchema>;

export default mongoose.models.StudentFollowUp ||
  mongoose.model("StudentFollowUp", studentFollowUpSchema);
