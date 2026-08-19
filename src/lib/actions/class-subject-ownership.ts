import "server-only";
import type { Types } from "mongoose";
import ClassModel from "@/models/Class";
import SubjectModel from "@/models/Subject";
import ExamModel from "@/models/Exam";
import { assertSameInstitute, type SessionPayload } from "@/lib/tenant/scope";

export async function assertTeachesSubject(subjectId: string, session: SessionPayload) {
  const subject = await SubjectModel.findById(subjectId);
  if (!subject) return null;
  assertSameInstitute(subject, session);
  if (subject.teacherId?.toString() !== session.userId) return null;
  return subject;
}

/**
 * General (subjectId-less) attendance may only be marked by the class teacher.
 * Period-based (subjectId set) attendance may be marked by any teacher of that
 * subject, provided the subject is actually linked to the class.
 */
export async function assertCanMarkAttendance(
  classId: string,
  subjectId: string | null,
  session: SessionPayload
) {
  const klass = await ClassModel.findById(classId);
  if (!klass) return null;
  assertSameInstitute(klass, session);

  if (subjectId) {
    const subject = await assertTeachesSubject(subjectId, session);
    if (!subject) return null;
    if (!subject.classIds.some((id: Types.ObjectId) => id.toString() === classId)) return null;
    return { class: klass, subject };
  }

  if (klass.classTeacherId?.toString() !== session.userId) return null;
  return { class: klass, subject: null };
}

/**
 * Exam scheduling is institute-admin's job; entering marks against a
 * scheduled exam is restricted to the teacher of its subject.
 */
export async function assertOwnsExam(examId: string, session: SessionPayload) {
  const exam = await ExamModel.findById(examId);
  if (!exam) return null;
  assertSameInstitute(exam, session);
  const subject = await assertTeachesSubject(exam.subjectId.toString(), session);
  if (!subject) return null;
  return { exam, subject };
}

/**
 * Class-scoped announcements may only be posted by that class's class teacher
 * (institute-admin has a separate, unrestricted path and doesn't call this).
 */
export async function assertCanAnnounceToClass(classId: string, session: SessionPayload) {
  const klass = await ClassModel.findById(classId);
  if (!klass) return null;
  assertSameInstitute(klass, session);
  if (klass.classTeacherId?.toString() !== session.userId) return null;
  return klass;
}
