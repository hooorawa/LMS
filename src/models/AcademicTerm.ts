import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const ACADEMIC_TERM_STATUSES = ["planned", "active", "completed"] as const;

const academicTermSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    name: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: ACADEMIC_TERM_STATUSES, default: "planned" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

academicTermSchema.index({ instituteId: 1, academicYear: 1, startsAt: 1 });

export type AcademicTerm = InferSchemaType<typeof academicTermSchema>;

export default mongoose.models.AcademicTerm ||
  mongoose.model("AcademicTerm", academicTermSchema);
