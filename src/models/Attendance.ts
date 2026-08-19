import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

const attendanceRecordSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ATTENDANCE_STATUSES, required: true },
  },
  { _id: false }
);

const attendanceSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    date: { type: Date, required: true },
    records: [attendanceRecordSchema],
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// One doc per class+subject+date — re-marking the same day upserts rather than duplicates.
attendanceSchema.index({ classId: 1, subjectId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ instituteId: 1, classId: 1 });

export type AttendanceRecord = {
  studentId: mongoose.Types.ObjectId;
  status: AttendanceStatus;
};

export type Attendance = InferSchemaType<typeof attendanceSchema>;

export default mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
