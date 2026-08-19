import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const ACADEMIC_EVENT_TYPES = ["class", "exam", "holiday", "event", "deadline"] as const;
const academicEventSchema = new Schema({
  instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ACADEMIC_EVENT_TYPES, required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, default: null },
  description: { type: String, trim: true, maxlength: 1000 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
academicEventSchema.index({ instituteId: 1, startsAt: 1 });
export type AcademicEvent = InferSchemaType<typeof academicEventSchema>;
export default mongoose.models.AcademicEvent || mongoose.model("AcademicEvent", academicEventSchema);
