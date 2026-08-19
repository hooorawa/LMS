import "server-only";
import EnrollmentModel from "@/models/Enrollment";
import type { SessionPayload } from "@/lib/tenant/scope";

export async function assertEnrolledInCourse(courseId: string, session: SessionPayload) {
  const enrollment = await EnrollmentModel.findOne({
    courseId,
    studentId: session.userId,
    instituteId: session.instituteId,
  });
  if (!enrollment) return null;
  return enrollment;
}
