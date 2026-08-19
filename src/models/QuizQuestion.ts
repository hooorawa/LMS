import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const QUIZ_QUESTION_TYPES = ["mcq", "truefalse", "short"] as const;
export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPES)[number];

const quizQuestionSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    type: { type: String, enum: QUIZ_QUESTION_TYPES, required: true },
    prompt: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    points: { type: Number, required: true, default: 1 },
    // mcq only — answer key, never sent to students before an attempt starts.
    options: [{ type: String, trim: true }],
    correctOptionIndex: { type: Number },
    // truefalse only — answer key.
    correctBoolean: { type: Boolean },
    // short only — reference answer for the teacher's grading view, not graded automatically.
    sampleAnswer: { type: String, trim: true },
  },
  { timestamps: true }
);

quizQuestionSchema.index({ quizId: 1, order: 1 });

export type QuizQuestion = InferSchemaType<typeof quizQuestionSchema>;

export default mongoose.models.QuizQuestion || mongoose.model("QuizQuestion", quizQuestionSchema);
