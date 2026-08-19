import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const GRADE_SOURCES = ["assignment", "quiz", "exam"] as const;
export type GradeSource = (typeof GRADE_SOURCES)[number];

const gradeSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Null for institute-wide/class-wide exams not tied to a course.
    courseId: { type: Schema.Types.ObjectId, ref: "Course", default: null },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", default: null },
    source: { type: String, enum: GRADE_SOURCES, required: true },
    // Submission._id for "assignment", QuizAttempt._id for "quiz", Marks._id for "exam".
    sourceId: { type: Schema.Types.ObjectId, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    weight: { type: Number, required: true, default: 1 },
    computedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

gradeSchema.index({ source: 1, sourceId: 1 }, { unique: true });
gradeSchema.index({ instituteId: 1, studentId: 1, courseId: 1 });

export type Grade = InferSchemaType<typeof gradeSchema>;

export default mongoose.models.Grade || mongoose.model("Grade", gradeSchema);
