import "server-only";
import CourseModel from "@/models/Course";
import ModuleModel from "@/models/Module";
import { assertSameInstitute, type SessionPayload } from "@/lib/tenant/scope";

export async function assertOwnsCourse(courseId: string, session: SessionPayload) {
  const course = await CourseModel.findById(courseId);
  if (!course) return null;
  assertSameInstitute(course, session);
  if (course.teacherId.toString() !== session.userId) return null;
  return course;
}

export async function assertOwnsModule(moduleId: string, session: SessionPayload) {
  const courseModule = await ModuleModel.findById(moduleId);
  if (!courseModule) return null;
  const course = await assertOwnsCourse(courseModule.courseId.toString(), session);
  if (!course) return null;
  return { module: courseModule, course };
}
