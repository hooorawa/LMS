import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const QUIZ_ATTEMPT_STATUSES = ["in_progress", "submitted", "graded"] as const;
export type QuizAttemptStatus = (typeof QUIZ_ATTEMPT_STATUSES)[number];

const quizAttemptAnswerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "QuizQuestion", required: true },
    type: { type: String, enum: ["mcq", "truefalse", "short"], required: true },
    selectedOptionIndex: { type: Number },
    selectedBoolean: { type: Boolean },
    textAnswer: { type: String, trim: true },
    isCorrect: { type: Boolean, default: null },
    pointsAwarded: { type: Number, default: 0 },
    needsManualGrade: { type: Boolean, default: false },
  },
  { _id: false }
);

const quizAttemptSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startedAt: { type: Date, required: true, default: Date.now },
    submittedAt: { type: Date },
    // Server-computed startedAt + quiz.timeLimitMinutes — the authoritative deadline.
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: QUIZ_ATTEMPT_STATUSES, default: "in_progress" },
    answers: [quizAttemptAnswerSchema],
    autoGradedScore: { type: Number, default: 0 },
    manualGradedScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Not unique — the one-attempt-per-student policy is enforced in startQuizAttempt.
quizAttemptSchema.index({ quizId: 1, studentId: 1 });

export type QuizAttemptAnswer = {
  questionId: mongoose.Types.ObjectId;
  type: "mcq" | "truefalse" | "short";
  selectedOptionIndex?: number;
  selectedBoolean?: boolean;
  textAnswer?: string;
  isCorrect?: boolean | null;
  pointsAwarded?: number;
  needsManualGrade?: boolean;
};

export type QuizAttempt = InferSchemaType<typeof quizAttemptSchema>;

export default mongoose.models.QuizAttempt || mongoose.model("QuizAttempt", quizAttemptSchema);
