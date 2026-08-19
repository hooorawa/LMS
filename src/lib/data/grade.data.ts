import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import GradeModel from "@/models/Grade";
import EnrollmentModel from "@/models/Enrollment";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { assertOwnsCourse } from "@/lib/actions/course-ownership";

export type CourseGradeRow = {
  studentId: string;
  name: string;
  email: string;
  totalScore: number;
  totalMaxScore: number;
  percent: number | null;
  itemCount: number;
};

export async function getCourseGradeSummaryForTeacher(courseId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const course = await assertOwnsCourse(courseId, session);
  if (!course) return null;

  const [enrollments, grades] = await Promise.all([
    EnrollmentModel.find({ courseId, status: "active" }).populate("studentId", "name email").lean(),
    GradeModel.find({ courseId }).lean(),
  ]);

  const totalsByStudent = new Map<string, { score: number; maxScore: number; count: number }>();
  for (const grade of grades) {
    const key = grade.studentId.toString();
    const entry = totalsByStudent.get(key) ?? { score: 0, maxScore: 0, count: 0 };
    entry.score += grade.score * grade.weight;
    entry.maxScore += grade.maxScore * grade.weight;
    entry.count += 1;
    totalsByStudent.set(key, entry);
  }

  const rows: CourseGradeRow[] = enrollments.map((enrollment) => {
    const student = enrollment.studentId as unknown as {
      _id: string;
      name?: string;
      email?: string;
    };
    const key = student._id.toString();
    const totals = totalsByStudent.get(key) ?? { score: 0, maxScore: 0, count: 0 };

    return {
      studentId: key,
      name: student.name ?? "Unknown student",
      email: student.email ?? "",
      totalScore: totals.score,
      totalMaxScore: totals.maxScore,
      percent: totals.maxScore > 0 ? (totals.score / totals.maxScore) * 100 : null,
      itemCount: totals.count,
    };
  });

  return { course, rows };
}

export type StudentCourseGradeGroup = {
  courseId: string;
  courseTitle: string;
  totalScore: number;
  totalMaxScore: number;
  percent: number | null;
  itemCount: number;
};

export async function getMyGradesForStudent(): Promise<StudentCourseGradeGroup[]> {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const grades = await GradeModel.find({ studentId: session.userId })
    .populate("courseId", "title")
    .populate("subjectId", "name")
    .lean();

  const groups = new Map<string, StudentCourseGradeGroup>();

  for (const grade of grades) {
    const course = grade.courseId as unknown as { _id: string; title?: string } | null;
    const subject = grade.subjectId as unknown as { _id: string; name?: string } | null;
    // Exam grades aren't tied to a course — group them by subject instead.
    const key = course ? course._id.toString() : `subject-${subject?._id?.toString() ?? "none"}`;
    const group = groups.get(key) ?? {
      courseId: course ? course._id.toString() : "",
      courseTitle: course?.title ?? (subject?.name ? `${subject.name} exams` : "Exams"),
      totalScore: 0,
      totalMaxScore: 0,
      percent: null,
      itemCount: 0,
    };
    group.totalScore += grade.score * grade.weight;
    group.totalMaxScore += grade.maxScore * grade.weight;
    group.itemCount += 1;
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      percent: group.totalMaxScore > 0 ? (group.totalScore / group.totalMaxScore) * 100 : null,
    }))
    .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
}
