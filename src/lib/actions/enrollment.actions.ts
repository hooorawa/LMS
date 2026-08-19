"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import EnrollmentModel from "@/models/Enrollment";
import CourseModel from "@/models/Course";
import ClassModel from "@/models/Class";
import LessonModel from "@/models/Lesson";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { bulkEnrollSchema } from "@/lib/validation/enrollment.schema";

export type BulkEnrollState = {
  error?: string;
  success?: {
    enrolledCount: number;
    alreadyEnrolledCount: number;
    courseTitle: string;
    className: string;
  };
};

export async function bulkEnrollStudents(
  _prevState: BulkEnrollState,
  formData: FormData
): Promise<BulkEnrollState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = bulkEnrollSchema.safeParse({
    classId: formData.get("classId"),
    courseId: formData.get("courseId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { classId, courseId } = parsed.data;

  await connectToDatabase();

  const klass = await ClassModel.findOne(withTenantScope({ _id: classId }, session));
  if (!klass) {
    return { error: "Class not found." };
  }

  const course = await CourseModel.findOne(
    withTenantScope({ _id: courseId, status: "published" }, session)
  );
  if (!course) {
    return { error: "Course not found or not published." };
  }

  const students = await UserModel.find({
    instituteId: session.instituteId,
    role: "student",
    "studentMeta.classId": classId,
  }).select("_id");

  if (students.length === 0) {
    return { error: "No students found in the selected class." };
  }

  const result = await EnrollmentModel.bulkWrite(
    students.map((student) => ({
      updateOne: {
        filter: { courseId: course._id, studentId: student._id },
        update: {
          $setOnInsert: {
            instituteId: session.instituteId,
            courseId: course._id,
            studentId: student._id,
            status: "active",
            createdBy: session.userId,
          },
        },
        upsert: true,
      },
    }))
  );

  const enrolledCount = result.upsertedCount ?? 0;
  const alreadyEnrolledCount = students.length - enrolledCount;

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "enrollment.bulk_create",
    targetType: "Course",
    targetId: course._id.toString(),
    targetName: course.title,
    summary: `Enrolled ${enrolledCount} student(s) from class "${klass.name}" into course "${course.title}"`,
    after: { classId: klass._id.toString(), courseId: course._id.toString(), enrolledCount },
  });

  revalidatePath("/enrollments");

  return {
    success: {
      enrolledCount,
      alreadyEnrolledCount,
      courseTitle: course.title,
      className: klass.name,
    },
  };
}

export async function markLessonComplete(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["student"]);

  const lessonId = formData.get("lessonId");
  const courseId = formData.get("courseId");
  if (typeof lessonId !== "string" || !lessonId || typeof courseId !== "string" || !courseId) {
    return;
  }

  await connectToDatabase();

  const enrollment = await EnrollmentModel.findOne({
    courseId,
    studentId: session.userId,
    instituteId: session.instituteId,
  });
  if (!enrollment) return;

  const lesson = await LessonModel.findOne({ _id: lessonId, courseId }).lean();
  if (!lesson) return;

  const alreadyComplete = enrollment.progress.completedLessonIds.some(
    (id: { toString(): string }) => id.toString() === lessonId
  );
  if (!alreadyComplete) {
    enrollment.progress.completedLessonIds.push(lessonId);
  }

  const totalLessons = await LessonModel.countDocuments({ courseId });
  const percentComplete =
    totalLessons > 0
      ? Math.round((enrollment.progress.completedLessonIds.length / totalLessons) * 100)
      : 0;

  enrollment.progress.percentComplete = percentComplete;
  enrollment.progress.lastAccessedAt = new Date();
  if (percentComplete === 100) {
    enrollment.status = "completed";
  }
  await enrollment.save();

  revalidatePath(`/my-courses/${courseId}`);
  revalidatePath(`/my-courses/${courseId}/lessons/${lessonId}`);
}
