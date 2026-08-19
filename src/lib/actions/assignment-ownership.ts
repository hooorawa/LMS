import "server-only";
import AssignmentModel from "@/models/Assignment";
import { assertSameInstitute, type SessionPayload } from "@/lib/tenant/scope";
import { assertOwnsCourse } from "@/lib/actions/course-ownership";

export async function assertOwnsAssignment(assignmentId: string, session: SessionPayload) {
  const assignment = await AssignmentModel.findById(assignmentId);
  if (!assignment) return null;
  assertSameInstitute(assignment, session);
  const course = await assertOwnsCourse(assignment.courseId.toString(), session);
  if (!course) return null;
  return { assignment, course };
}
