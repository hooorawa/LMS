import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const CLASS_SESSION_STATUSES = ["scheduled", "ongoing", "completed", "cancelled"] as const;
export type ClassSessionStatus = (typeof CLASS_SESSION_STATUSES)[number];

export const CLASS_BREAK_STATUSES = ["none", "on_break"] as const;
export type ClassBreakStatus = (typeof CLASS_BREAK_STATUSES)[number];

const classBreakSchema = new Schema(
  {
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    duration: { type: Number, default: 0 },
  },
  { _id: false }
);

const classSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    name: { type: String, required: true, trim: true },
    section: { type: String, trim: true },
    academicYear: { type: String, required: true, trim: true },
    timetable: [
      {
        day: { type: String, enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
        startTime: { type: String, trim: true },
        endTime: { type: String, trim: true },
        room: { type: String, trim: true },
      },
    ],
    classTeacherId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["active", "archived"], default: "active" },
    sessionStatus: { type: String, enum: CLASS_SESSION_STATUSES, default: "scheduled" },
    breakStatus: { type: String, enum: CLASS_BREAK_STATUSES, default: "none" },
    breaks: { type: [classBreakSchema], default: [] },
    totalBreakDuration: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

classSchema.index({ instituteId: 1, academicYear: 1 });

export type ClassBreak = InferSchemaType<typeof classBreakSchema>;

export type Class = InferSchemaType<typeof classSchema>;

export default mongoose.models.Class || mongoose.model("Class", classSchema);
