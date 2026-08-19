import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const EXAM_REGISTRATION_STATUSES = ["registered", "cancelled"] as const;
export type ExamRegistrationStatus = (typeof EXAM_REGISTRATION_STATUSES)[number];

const examRegistrationSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: EXAM_REGISTRATION_STATUSES, default: "registered" },
    specialRequirements: { type: String, trim: true, maxlength: 1000 },
    registeredAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

examRegistrationSchema.index({ examId: 1, studentId: 1 }, { unique: true });
examRegistrationSchema.index({ instituteId: 1, studentId: 1, status: 1 });

export type ExamRegistration = InferSchemaType<typeof examRegistrationSchema>;

export default mongoose.models.ExamRegistration ||
  mongoose.model("ExamRegistration", examRegistrationSchema);
