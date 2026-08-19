import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const ENROLLMENT_STATUSES = ["active", "completed", "dropped"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

const enrollmentSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    enrolledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ENROLLMENT_STATUSES, default: "active" },
    progress: {
      completedLessonIds: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
      percentComplete: { type: Number, default: 0 },
      lastAccessedAt: { type: Date },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

enrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });
enrollmentSchema.index({ instituteId: 1, studentId: 1 });

export type Enrollment = InferSchemaType<typeof enrollmentSchema>;

export default mongoose.models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);
