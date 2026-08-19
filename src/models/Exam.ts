import mongoose, { Schema, type InferSchemaType } from "mongoose";

const examSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    title: { type: String, required: true, trim: true },
    examDate: { type: Date, required: true },
    maxMarks: { type: Number, required: true },
    term: { type: String, trim: true },
    academicYear: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

examSchema.index({ instituteId: 1, classId: 1 });
examSchema.index({ instituteId: 1, subjectId: 1 });

export type Exam = InferSchemaType<typeof examSchema>;

export default mongoose.models.Exam || mongoose.model("Exam", examSchema);
