import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import CourseModel from "@/models/Course";
import ModuleModel from "@/models/Module";
import LessonModel from "@/models/Lesson";
import UserModel from "@/models/User";
import { requireSession, requireRole, assertSameInstitute, withTenantScope } from "@/lib/tenant/scope";

export async function listPublishedCoursesForInstitute() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return CourseModel.find(withTenantScope({ status: "published" }, session))
    .select("title teacherId")
    .populate("teacherId", "name")
    .sort({ title: 1 })
    .lean();
}

export async function listPublishedCoursesForStudentCatalog() {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();
  const student = await UserModel.findById(session.userId).select("studentMeta.classId").lean();
  const classId = student?.studentMeta?.classId;
  if (!classId) return [];

  return CourseModel.find(withTenantScope({ status: "published", classIds: classId }, session))
    .populate("teacherId", "name")
    .populate("subjectId", "name code")
    .sort({ title: 1 })
    .lean();
}

export async function listCoursesForTeacher() {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();
  return CourseModel.find({ instituteId: session.instituteId, teacherId: session.userId })
    .populate("subjectId", "name code")
    .populate("classIds", "name section")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getCourseForTeacher(courseId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const course = await CourseModel.findById(courseId)
    .populate("subjectId", "name code")
    .populate("classIds", "name section")
    .lean();

  if (!course) return null;
  assertSameInstitute(course, session);
  if (course.teacherId.toString() !== session.userId) {
    throw new Error("Resource not found");
  }

  const modules = await ModuleModel.find({ courseId }).sort({ order: 1 }).lean();
  const lessons = await LessonModel.find({ courseId }).sort({ order: 1 }).lean();

  const modulesWithLessons = modules.map((module) => ({
    ...module,
    lessons: lessons.filter((lesson) => lesson.moduleId.toString() === module._id.toString()),
  }));

  return { ...course, modules: modulesWithLessons };
}

export async function getLessonForTeacher(lessonId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const lesson = await LessonModel.findById(lessonId).lean();
  if (!lesson) return null;
  assertSameInstitute(lesson, session);

  const course = await CourseModel.findById(lesson.courseId).lean();
  if (!course || course.teacherId.toString() !== session.userId) {
    throw new Error("Resource not found");
  }

  return lesson;
}
