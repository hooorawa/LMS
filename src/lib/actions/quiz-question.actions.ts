"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import QuizQuestionModel, { type QuizQuestionType } from "@/models/QuizQuestion";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createQuizQuestionSchema } from "@/lib/validation/quiz-question.schema";
import { assertOwnsQuiz, assertOwnsQuizQuestion } from "@/lib/actions/quiz-ownership";

function questionFieldsFromForm(formData: FormData) {
  const type = formData.get("type") as QuizQuestionType;
  const base = {
    type,
    prompt: formData.get("prompt"),
    points: formData.get("points") || 1,
  };

  switch (type) {
    case "mcq":
      return {
        ...base,
        options: formData.getAll("options").filter((value) => typeof value === "string"),
        correctOptionIndex: formData.get("correctOptionIndex"),
      };
    case "truefalse":
      return { ...base, correctBoolean: formData.get("correctBoolean") === "true" };
    case "short":
      return { ...base, sampleAnswer: formData.get("sampleAnswer") };
    default:
      return base;
  }
}

export type CreateQuizQuestionState = {
  error?: string;
  success?: { questionId: string };
};

export async function createQuizQuestion(
  _prevState: CreateQuizQuestionState,
  formData: FormData
): Promise<CreateQuizQuestionState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const quizId = formData.get("quizId");
  if (typeof quizId !== "string" || !quizId) {
    return { error: "Missing quiz id." };
  }

  const parsed = createQuizQuestionSchema.safeParse(questionFieldsFromForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const owned = await assertOwnsQuiz(quizId, session);
  if (!owned) {
    return { error: "Quiz not found." };
  }
  const { quiz, course } = owned;

  const order = await QuizQuestionModel.countDocuments({ quizId: quiz._id });

  const question = await QuizQuestionModel.create({
    instituteId: session.instituteId,
    quizId: quiz._id,
    order,
    ...parsed.data,
  });

  quiz.questionOrder.push(question._id);
  await quiz.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "quiz_question.create",
    targetType: "QuizQuestion",
    targetId: question._id.toString(),
    targetName: quiz.title,
    summary: `Added a ${question.type} question to quiz "${quiz.title}"`,
    after: { type: question.type, prompt: question.prompt },
  });

  revalidatePath(`/courses/${course._id.toString()}/quizzes/${quiz._id.toString()}`);

  return { success: { questionId: question._id.toString() } };
}

export type UpdateQuizQuestionState = {
  error?: string;
  success?: { questionId: string };
};

export async function updateQuizQuestion(
  _prevState: UpdateQuizQuestionState,
  formData: FormData
): Promise<UpdateQuizQuestionState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing question id." };
  }

  const parsed = createQuizQuestionSchema.safeParse(questionFieldsFromForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const owned = await assertOwnsQuizQuestion(id, session);
  if (!owned) {
    return { error: "Question not found." };
  }
  const { question, quiz, course } = owned;

  const before = { type: question.type, prompt: question.prompt };

  question.set({
    options: undefined,
    correctOptionIndex: undefined,
    correctBoolean: undefined,
    sampleAnswer: undefined,
    ...parsed.data,
  });
  await question.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "quiz_question.update",
    targetType: "QuizQuestion",
    targetId: question._id.toString(),
    targetName: quiz.title,
    summary: `Updated a question in quiz "${quiz.title}"`,
    before,
    after: { type: question.type, prompt: question.prompt },
  });

  revalidatePath(`/courses/${course._id.toString()}/quizzes/${quiz._id.toString()}`);

  return { success: { questionId: question._id.toString() } };
}

export async function deleteQuizQuestion(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const owned = await assertOwnsQuizQuestion(id, session);
  if (!owned) return;
  const { question, quiz, course } = owned;

  await QuizQuestionModel.deleteOne({ _id: question._id });

  quiz.questionOrder = quiz.questionOrder.filter(
    (questionId: { toString(): string }) => questionId.toString() !== question._id.toString()
  );
  await quiz.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "quiz_question.delete",
    targetType: "QuizQuestion",
    targetId: question._id.toString(),
    targetName: quiz.title,
    summary: `Deleted a question from quiz "${quiz.title}"`,
    before: { type: question.type, prompt: question.prompt },
  });

  revalidatePath(`/courses/${course._id.toString()}/quizzes/${quiz._id.toString()}`);
}

export async function moveQuizQuestion(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  const direction = formData.get("direction");
  if (typeof id !== "string" || !id || (direction !== "up" && direction !== "down")) return;

  await connectToDatabase();

  const owned = await assertOwnsQuizQuestion(id, session);
  if (!owned) return;
  const { question, quiz, course } = owned;

  const neighbor = await QuizQuestionModel.findOne({
    quizId: quiz._id,
    order: direction === "up" ? { $lt: question.order } : { $gt: question.order },
  }).sort({ order: direction === "up" ? -1 : 1 });

  if (!neighbor) return;

  const currentOrder = question.order;
  question.order = neighbor.order;
  neighbor.order = currentOrder;
  await Promise.all([question.save(), neighbor.save()]);

  revalidatePath(`/courses/${course._id.toString()}/quizzes/${quiz._id.toString()}`);
}
