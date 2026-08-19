import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import EnrollmentModel from "@/models/Enrollment";
import AssignmentModel from "@/models/Assignment";
import SubmissionModel from "@/models/Submission";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getMyGradesForStudent } from "@/lib/data/grade.data";
import { getMyAttendanceHistory } from "@/lib/data/attendance.data";
import { getStudentFeeOverview } from "@/lib/data/fee.data";
import { countUnreadForUser } from "@/lib/data/notification.data";

export type UpcomingAssignmentRow = {
  id: string;
  title: string;
  courseTitle: string;
  dueAt: Date;
};

export async function getStudentDashboardData() {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const enrollments = await EnrollmentModel.find({
    studentId: session.userId,
    status: "active",
  }).select("courseId");
  const courseIds = enrollments.map((enrollment) => enrollment.courseId);

  const [assignments, submissions, gradeGroups, attendance, feeOverview, unreadCount] =
    await Promise.all([
      courseIds.length
        ? AssignmentModel.find({
            courseId: { $in: courseIds },
            status: "published",
            dueAt: { $gte: new Date() },
          })
            .populate("courseId", "title")
            .sort({ dueAt: 1 })
            .limit(10)
            .lean()
        : [],
      SubmissionModel.find({ studentId: session.userId }).select("assignmentId").lean(),
      getMyGradesForStudent(),
      getMyAttendanceHistory(),
      getStudentFeeOverview(session.userId),
      countUnreadForUser(),
    ]);

  const submittedAssignmentIds = new Set(
    submissions.map((submission) => submission.assignmentId.toString())
  );

  const upcomingAssignments: UpcomingAssignmentRow[] = assignments
    .filter((assignment) => !submittedAssignmentIds.has(assignment._id.toString()))
    .slice(0, 5)
    .map((assignment) => ({
      id: assignment._id.toString(),
      title: assignment.title,
      courseTitle:
        (assignment.courseId as unknown as { title?: string } | null)?.title ?? "Course",
      dueAt: assignment.dueAt,
    }));

  return {
    courseCount: enrollments.length,
    activeCourseCount: enrollments.filter((enrollment) => enrollment.status === "active").length,
    averageCourseProgress:
      enrollments.length > 0
        ? Math.round(
            enrollments.reduce(
              (sum, enrollment) => sum + (enrollment.progress?.percentComplete ?? 0),
              0
            ) / enrollments.length
          )
        : 0,
    upcomingAssignments,
    gradeGroups,
    attendancePercent: attendance.percentPresent,
    feeBalance: feeOverview?.balance ?? 0,
    unreadNotificationCount: unreadCount,
  };
}
