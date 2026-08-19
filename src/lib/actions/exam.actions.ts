"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import ExamModel from "@/models/Exam";
import MarksModel from "@/models/Marks";
import GradeModel from "@/models/Grade";
import SubjectModel from "@/models/Subject";
import ClassModel from "@/models/Class";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createExamSchema, updateExamSchema } from "@/lib/validation/exam.schema";

export type CreateExamState = {
  error?: string;
  success?: {
    examId: string;
    title: string;
  };
};

export async function createExam(
  _prevState: CreateExamState,
  formData: FormData
): Promise<CreateExamState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = createExamSchema.safeParse({
    subjectId: formData.get("subjectId"),
    classId: formData.get("classId"),
    title: formData.get("title"),
    examDate: formData.get("examDate"),
    maxMarks: formData.get("maxMarks"),
    term: formData.get("term"),
    academicYear: formData.get("academicYear"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { subjectId, classId, title, examDate, maxMarks, term, academicYear } = parsed.data;

  await connectToDatabase();

  const subject = await SubjectModel.findOne(withTenantScope({ _id: subjectId }, session));
  if (!subject) {
    return { error: "Subject not found in your institute." };
  }

  const klass = await ClassModel.findOne(withTenantScope({ _id: classId }, session));
  if (!klass) {
    return { error: "Class not found in your institute." };
  }

  const exam = await ExamModel.create({
    instituteId: session.instituteId,
    subjectId,
    classId,
    title,
    examDate: new Date(examDate),
    maxMarks,
    term: term || undefined,
    academicYear,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "exam.create",
    targetType: "Exam",
    targetId: exam._id.toString(),
    targetName: exam.title,
    summary: `Scheduled exam "${exam.title}" for ${klass.name}`,
    after: { title: exam.title, examDate: exam.examDate, maxMarks: exam.maxMarks },
  });

  revalidatePath("/exams");

  return { success: { examId: exam._id.toString(), title: exam.title } };
}

export type UpdateExamState = {
  error?: string;
  success?: {
    examId: string;
    title: string;
  };
};

export async function updateExam(
  _prevState: UpdateExamState,
  formData: FormData
): Promise<UpdateExamState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing exam id." };
  }

  const parsed = updateExamSchema.safeParse({
    subjectId: formData.get("subjectId"),
    classId: formData.get("classId"),
    title: formData.get("title"),
    examDate: formData.get("examDate"),
    maxMarks: formData.get("maxMarks"),
    term: formData.get("term"),
    academicYear: formData.get("academicYear"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { subjectId, classId, title, examDate, maxMarks, term, academicYear } = parsed.data;

  await connectToDatabase();

  const exam = await ExamModel.findOne(withTenantScope({ _id: id }, session));
  if (!exam) {
    return { error: "Exam not found." };
  }

  const subject = await SubjectModel.findOne(withTenantScope({ _id: subjectId }, session));
  if (!subject) {
    return { error: "Subject not found in your institute." };
  }

  const klass = await ClassModel.findOne(withTenantScope({ _id: classId }, session));
  if (!klass) {
    return { error: "Class not found in your institute." };
  }

  const before = {
    title: exam.title,
    examDate: exam.examDate,
    maxMarks: exam.maxMarks,
  };

  exam.subjectId = subjectId;
  exam.classId = classId;
  exam.title = title;
  exam.examDate = new Date(examDate);
  exam.maxMarks = maxMarks;
  exam.term = term || undefined;
  exam.academicYear = academicYear;
  await exam.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "exam.update",
    targetType: "Exam",
    targetId: exam._id.toString(),
    targetName: exam.title,
    summary: `Updated exam "${exam.title}"`,
    before,
    after: { title: exam.title, examDate: exam.examDate, maxMarks: exam.maxMarks },
  });

  revalidatePath("/exams");

  return { success: { examId: exam._id.toString(), title: exam.title } };
}

export async function deleteExam(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const exam = await ExamModel.findOne(withTenantScope({ _id: id }, session));
  if (!exam) return;

  await ExamModel.deleteOne({ _id: exam._id });
  await MarksModel.deleteMany({ examId: exam._id });
  await GradeModel.deleteMany({ source: "exam", examId: exam._id });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "exam.delete",
    targetType: "Exam",
    targetId: exam._id.toString(),
    targetName: exam.title,
    summary: `Deleted exam "${exam.title}"`,
    before: { title: exam.title, examDate: exam.examDate, maxMarks: exam.maxMarks },
  });

  revalidatePath("/exams");
}
