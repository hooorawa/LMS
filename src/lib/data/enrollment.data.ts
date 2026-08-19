import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import EnrollmentModel from "@/models/Enrollment";
import CourseModel from "@/models/Course";
import ModuleModel from "@/models/Module";
import LessonModel from "@/models/Lesson";
import { requireSession, requireRole, withTenantScope, assertSameInstitute } from "@/lib/tenant/scope";
import { createReadUrl } from "@/lib/storage/s3";

export async function listEnrollmentsForInstitute(limit = 20) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return EnrollmentModel.find(withTenantScope({}, session))
    .populate("studentId", "name email")
    .populate("courseId", "title")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function listEnrolledCoursesForStudent() {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();
  const enrollments = await EnrollmentModel.find({
    studentId: session.userId,
    instituteId: session.instituteId,
  })
    .populate("courseId", "title description coverImageUrl status")
    .sort({ "progress.lastAccessedAt": -1, createdAt: -1 })
    .lean();

  return enrollments
    .filter((enrollment) => enrollment.courseId)
    .map((enrollment) => {
      const course = enrollment.courseId as unknown as {
        _id: unknown;
        title: string;
        description?: string;
      };
      return {
        enrollmentId: String(enrollment._id),
        courseId: String(course._id),
        title: course.title,
        description: course.description,
        percentComplete: enrollment.progress?.percentComplete ?? 0,
        status: enrollment.status,
      };
    });
}

export async function getEnrolledCourseForStudent(courseId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const enrollment = await EnrollmentModel.findOne({
    courseId,
    studentId: session.userId,
    instituteId: session.instituteId,
  }).lean();
  if (!enrollment) return null;

  const course = await CourseModel.findById(courseId)
    .populate("teacherId", "name")
    .populate("subjectId", "name")
    .lean();
  if (!course) return null;
  assertSameInstitute(course, session);

  const modules = await ModuleModel.find({ courseId }).sort({ order: 1 }).lean();
  const lessons = await LessonModel.find({ courseId }).sort({ order: 1 }).lean();

  const completedLessonIds = new Set(
    (enrollment.progress?.completedLessonIds ?? []).map((id: { toString(): string }) =>
      id.toString()
    )
  );

  const modulesWithLessons = modules.map((courseModule) => ({
    ...courseModule,
    lessons: lessons
      .filter((lesson) => lesson.moduleId.toString() === courseModule._id.toString())
      .map((lesson) => ({
        ...lesson,
        isComplete: completedLessonIds.has(lesson._id.toString()),
      })),
  }));

  return {
    ...course,
    modules: modulesWithLessons,
    enrollmentStatus: enrollment.status,
    percentComplete: enrollment.progress?.percentComplete ?? 0,
  };
}

export async function getLessonForStudent(lessonId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const lesson = await LessonModel.findById(lessonId).lean();
  if (!lesson) return null;
  assertSameInstitute(lesson, session);

  const enrollment = await EnrollmentModel.findOne({
    courseId: lesson.courseId,
    studentId: session.userId,
    instituteId: session.instituteId,
  });
  if (!enrollment) return null;

  enrollment.progress.lastAccessedAt = new Date();
  await enrollment.save();

  const course = await CourseModel.findById(lesson.courseId).select("title").lean();

  const modules = await ModuleModel.find({ courseId: lesson.courseId }).sort({ order: 1 }).lean();
  const lessons = await LessonModel.find({ courseId: lesson.courseId }).sort({ order: 1 }).lean();

  const orderedLessonIds = modules.flatMap((courseModule) =>
    lessons
      .filter((item) => item.moduleId.toString() === courseModule._id.toString())
      .map((item) => item._id.toString())
  );

  const currentIndex = orderedLessonIds.indexOf(lessonId);
  const prevLessonId = currentIndex > 0 ? orderedLessonIds[currentIndex - 1] : null;
  const nextLessonId =
    currentIndex >= 0 && currentIndex < orderedLessonIds.length - 1
      ? orderedLessonIds[currentIndex + 1]
      : null;

  const completedLessonIds = new Set(
    (enrollment.progress.completedLessonIds ?? []).map((id: { toString(): string }) =>
      id.toString()
    )
  );

  let contentUrl: string | null = null;
  if ((lesson.type === "video" || lesson.type === "pdf") && lesson.contentUrl) {
    contentUrl = await createReadUrl(lesson.contentUrl);
  } else if (lesson.type === "link") {
    contentUrl = lesson.contentUrl ?? null;
  }

  return {
    ...lesson,
    contentUrl,
    courseId: lesson.courseId.toString(),
    courseTitle: course?.title ?? "",
    isComplete: completedLessonIds.has(lessonId),
    prevLessonId,
    nextLessonId,
  };
}
