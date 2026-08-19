import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const CLASS_ATTEMPT_STATUSES = ["active", "left"] as const;
export type ClassAttemptStatus = (typeof CLASS_ATTEMPT_STATUSES)[number];

export const CLASS_ATTEMPT_ATTENDANCE = ["pending", "attended", "absent"] as const;
export type ClassAttemptAttendance = (typeof CLASS_ATTEMPT_ATTENDANCE)[number];

const classAttemptSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: CLASS_ATTEMPT_STATUSES, default: "active" },
    attendance: { type: String, enum: CLASS_ATTEMPT_ATTENDANCE, default: "pending" },
    joinedAt: { type: Date, default: null },
    leftAt: { type: Date, default: null },
    attendanceMarkedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One attempt per student per class per day — rejoining the same session's day upserts.
classAttemptSchema.index({ classId: 1, studentId: 1, date: 1 }, { unique: true });
classAttemptSchema.index({ instituteId: 1, classId: 1 });

export type ClassAttempt = InferSchemaType<typeof classAttemptSchema>;

export default mongoose.models.ClassAttempt || mongoose.model("ClassAttempt", classAttemptSchema);
