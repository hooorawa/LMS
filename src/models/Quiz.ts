import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const QUIZ_STATUSES = ["draft", "published"] as const;
export type QuizStatus = (typeof QUIZ_STATUSES)[number];

const quizSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true },
    timeLimitMinutes: { type: Number, required: true },
    status: { type: String, enum: QUIZ_STATUSES, default: "draft" },
    questionOrder: [{ type: Schema.Types.ObjectId, ref: "QuizQuestion" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

quizSchema.index({ courseId: 1, status: 1 });

export type Quiz = InferSchemaType<typeof quizSchema>;

export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
