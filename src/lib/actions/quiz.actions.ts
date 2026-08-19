"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import QuizModel, { QUIZ_STATUSES, type QuizStatus } from "@/models/Quiz";
import QuizQuestionModel from "@/models/QuizQuestion";
import QuizAttemptModel from "@/models/QuizAttempt";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createQuizSchema, updateQuizSchema } from "@/lib/validation/quiz.schema";
import { assertOwnsCourse } from "@/lib/actions/course-ownership";
import { assertOwnsQuiz } from "@/lib/actions/quiz-ownership";

export type CreateQuizState = {
  error?: string;
  success?: { quizId: string; title: string };
};

export async function createQuiz(
  _prevState: CreateQuizState,
  formData: FormData
): Promise<CreateQuizState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const courseId = formData.get("courseId");
  if (typeof courseId !== "string" || !courseId) {
    return { error: "Missing course id." };
  }

  const parsed = createQuizSchema.safeParse({
    title: formData.get("title"),
    instructions: formData.get("instructions"),
    timeLimitMinutes: formData.get("timeLimitMinutes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const course = await assertOwnsCourse(courseId, session);
  if (!course) {
    return { error: "Course not found." };
  }

  const { title, instructions, timeLimitMinutes } = parsed.data;

  const quiz = await QuizModel.create({
    instituteId: session.instituteId,
    courseId: course._id,
    teacherId: session.userId,
    title,
    instructions: instructions || undefined,
    timeLimitMinutes,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "quiz.create",
    targetType: "Quiz",
    targetId: quiz._id.toString(),
    targetName: quiz.title,
    summary: `Created quiz "${quiz.title}" in course "${course.title}"`,
    after: { title: quiz.title, timeLimitMinutes: quiz.timeLimitMinutes },
  });

  revalidatePath(`/courses/${course._id.toString()}/quizzes`);

  return { success: { quizId: quiz._id.toString(), title: quiz.title } };
}

export type UpdateQuizState = {
  error?: string;
  success?: { quizId: string; title: string };
};

export async function updateQuiz(
  _prevState: UpdateQuizState,
  formData: FormData
): Promise<UpdateQuizState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing quiz id." };
  }

  const parsed = updateQuizSchema.safeParse({
    title: formData.get("title"),
    instructions: formData.get("instructions"),
    timeLimitMinutes: formData.get("timeLimitMinutes"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const owned = await assertOwnsQuiz(id, session);
  if (!owned) {
    return { error: "Quiz not found." };
  }
  const { quiz, course } = owned;

  const { title, instructions, timeLimitMinutes, status } = parsed.data;

  const before = {
    title: quiz.title,
    instructions: quiz.instructions,
    timeLimitMinutes: quiz.timeLimitMinutes,
    status: quiz.status,
  };

  quiz.title = title;
  quiz.instructions = instructions || undefined;
  quiz.timeLimitMinutes = timeLimitMinutes;
  quiz.status = status;
  await quiz.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "quiz.update",
    targetType: "Quiz",
    targetId: quiz._id.toString(),
    targetName: quiz.title,
    summary: `Updated quiz "${quiz.title}"`,
    before,
    after: { title: quiz.title, timeLimitMinutes: quiz.timeLimitMinutes, status: quiz.status },
  });

  revalidatePath(`/courses/${course._id.toString()}/quizzes`);
  revalidatePath(`/courses/${course._id.toString()}/quizzes/${quiz._id.toString()}`);

  return { success: { quizId: quiz._id.toString(), title: quiz.title } };
}

export async function setQuizStatus(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || !id || typeof status !== "string") return;
  if (!QUIZ_STATUSES.includes(status as QuizStatus)) return;

  await connectToDatabase();

  const owned = await assertOwnsQuiz(id, session);
  if (!owned) return;
  const { quiz, course } = owned;

  const before = quiz.status;
  quiz.status = status as QuizStatus;
  await quiz.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "quiz.status_change",
    targetType: "Quiz",
    targetId: quiz._id.toString(),
    targetName: quiz.title,
    summary: `Changed quiz "${quiz.title}" status from ${before} to ${quiz.status}`,
    before: { status: before },
    after: { status: quiz.status },
  });

  revalidatePath(`/courses/${course._id.toString()}/quizzes`);
  revalidatePath(`/courses/${course._id.toString()}/quizzes/${quiz._id.toString()}`);
}

export async function deleteQuiz(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const owned = await assertOwnsQuiz(id, session);
  if (!owned) return;
  const { quiz, course } = owned;

  await QuizAttemptModel.deleteMany({ quizId: quiz._id });
  await QuizQuestionModel.deleteMany({ quizId: quiz._id });
  await QuizModel.deleteOne({ _id: quiz._id });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "quiz.delete",
    targetType: "Quiz",
    targetId: quiz._id.toString(),
    targetName: quiz.title,
    summary: `Deleted quiz "${quiz.title}"`,
    before: { title: quiz.title },
  });

  revalidatePath(`/courses/${course._id.toString()}/quizzes`);
}
