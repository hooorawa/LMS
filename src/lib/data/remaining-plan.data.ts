import "server-only";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import AttendanceModel from "@/models/Attendance";
import ClassModel from "@/models/Class";
import CourseModel from "@/models/Course";
import EnrollmentModel from "@/models/Enrollment";
import ExamModel from "@/models/Exam";
import FeeModel from "@/models/Fee";
import MarksModel from "@/models/Marks";
import PaymentModel from "@/models/Payment";
import QuizAttemptModel from "@/models/QuizAttempt";
import SubjectModel from "@/models/Subject";
import SubmissionModel from "@/models/Submission";
import UserModel from "@/models/User";
import { getInstituteRecentActivity } from "@/lib/data/dashboard.data";
import { getFinanceTrend, getIncomeStatistics } from "@/lib/data/finance.data";
import { getStudentFeatureSnapshot, getTeacherFeatureSnapshot } from "@/lib/data/feature-plan.data";

export async function getStudentDeadlinesData() {
  const snapshot = await getStudentFeatureSnapshot();

  return {
    assignments: snapshot.upcomingDeadlines,
    exams: snapshot.upcomingExams,
    events: snapshot.upcomingEvents.filter((event) =>
      ["deadline", "exam", "class"].includes(event.type)
    ),
    reminders: [
      ...snapshot.upcomingDeadlines.slice(0, 3).map((deadline) => ({
        id: `assignment-${deadline.id}`,
        title: deadline.title,
        detail: `Assignment due for ${deadline.courseTitle}`,
        date: deadline.dueAt,
        tone: "warning" as const,
      })),
      ...snapshot.upcomingExams.slice(0, 3).map((exam) => ({
        id: `exam-${exam.id}`,
        title: exam.title,
        detail: `${exam.subject} exam registration is ${exam.registrationStatus}`,
        date: exam.examDate,
        tone: exam.registrationStatus === "registered" ? ("success" as const) : ("warning" as const),
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime()),
  };
}

export async function getStudentExamResultsData() {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const marks = await MarksModel.find({
    instituteId: session.instituteId,
    studentId: session.userId,
  })
    .populate({
      path: "examId",
      select: "title examDate maxMarks term academicYear subjectId classId",
      populate: [
        { path: "subjectId", select: "name code" },
        { path: "classId", select: "name section" },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

  return marks.map((mark) => {
    const exam = mark.examId as unknown as {
      title?: string;
      examDate?: Date;
      maxMarks?: number;
      term?: string;
      academicYear?: string;
      subjectId?: { name?: string; code?: string };
      classId?: { name?: string; section?: string };
    } | null;
    const maxMarks = exam?.maxMarks ?? 0;
    return {
      id: String(mark._id),
      title: exam?.title ?? "Deleted exam",
      subject: exam?.subjectId?.name ?? "Subject",
      subjectCode: exam?.subjectId?.code ?? "",
      className: exam?.classId
        ? `${exam.classId.name ?? "Class"}${exam.classId.section ? ` - ${exam.classId.section}` : ""}`
        : "Class",
      examDate: exam?.examDate ?? mark.createdAt,
      term: exam?.term ?? "",
      academicYear: exam?.academicYear ?? "",
      marksObtained: mark.marksObtained,
      maxMarks,
      percent: maxMarks > 0 ? (mark.marksObtained / maxMarks) * 100 : null,
      grade: mark.grade ?? "",
      remarks: mark.remarks ?? "",
    };
  });
}

export async function getTeacherWorkspaceData() {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const [snapshot, courses, ownedClasses] = await Promise.all([
    getTeacherFeatureSnapshot(),
    CourseModel.find({ instituteId: session.instituteId, teacherId: session.userId })
      .select("title status")
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean(),
    ClassModel.find(withTenantScope({ classTeacherId: session.userId }, session))
      .select("name section sessionStatus breakStatus")
      .sort({ name: 1 })
      .lean(),
  ]);

  return {
    ...snapshot,
    courses: courses.map((course) => ({
      id: String(course._id),
      title: course.title,
      status: course.status,
    })),
    managedClasses: ownedClasses.map((klass) => ({
      id: String(klass._id),
      name: klass.section ? `${klass.name} ${klass.section}` : klass.name,
      sessionStatus: klass.sessionStatus,
      breakStatus: klass.breakStatus,
    })),
  };
}

export async function getAdminOperationsData() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const now = new Date();
  const [
    students,
    staff,
    classes,
    subjects,
    enrollments,
    exams,
    fees,
    payments,
    finance,
    recentActivity,
  ] = await Promise.all([
    UserModel.countDocuments(withTenantScope({ role: "student" }, session)),
    UserModel.find(withTenantScope({ role: "institute-staff" }, session)).select("name staffMeta.basicSalary").lean(),
    ClassModel.find(withTenantScope({}, session)).populate("classTeacherId", "name").lean(),
    SubjectModel.find(withTenantScope({}, session)).populate("teacherId", "name").lean(),
    EnrollmentModel.countDocuments(withTenantScope({ status: "active" }, session)),
    ExamModel.find(withTenantScope({ examDate: { $gte: now } }, session)).lean(),
    FeeModel.find(withTenantScope({}, session)).select("amount dueDate").lean(),
    PaymentModel.find(withTenantScope({}, session)).select("feeId amount").lean(),
    getIncomeStatistics(),
    getInstituteRecentActivity(8),
  ]);

  const paidByFee = new Map<string, number>();
  for (const payment of payments) {
    if (!payment.feeId) continue;
    paidByFee.set(String(payment.feeId), (paidByFee.get(String(payment.feeId)) ?? 0) + payment.amount);
  }

  const dueAmount = fees.reduce((sum, fee) => sum + Math.max(0, fee.amount - (paidByFee.get(String(fee._id)) ?? 0)), 0);
  const overdueAmount = fees.reduce((sum, fee) => {
    const balance = Math.max(0, fee.amount - (paidByFee.get(String(fee._id)) ?? 0));
    return fee.dueDate.getTime() < now.getTime() ? sum + balance : sum;
  }, 0);

  const teacherClassCounts = new Map<string, number>();
  for (const klass of classes) {
    if (!klass.classTeacherId) continue;
    const teacherId = String((klass.classTeacherId as unknown as { _id?: unknown })._id ?? klass.classTeacherId);
    teacherClassCounts.set(teacherId, (teacherClassCounts.get(teacherId) ?? 0) + 1);
  }

  const subjectCounts = new Map<string, number>();
  for (const subject of subjects) {
    if (!subject.teacherId) continue;
    const teacherId = String((subject.teacherId as unknown as { _id?: unknown })._id ?? subject.teacherId);
    subjectCounts.set(teacherId, (subjectCounts.get(teacherId) ?? 0) + 1);
  }

  return {
    counts: {
      students,
      staff: staff.length,
      classes: classes.length,
      subjects: subjects.length,
      enrollments,
      upcomingExams: exams.length,
    },
    finance: {
      ...finance,
      collected: payments.reduce((sum, payment) => sum + payment.amount, 0),
      dueAmount,
      overdueAmount,
    },
    capacity: classes.map((klass) => ({
      id: String(klass._id),
      name: klass.section ? `${klass.name} ${klass.section}` : klass.name,
      academicYear: klass.academicYear,
      teacher: (klass.classTeacherId as unknown as { name?: string } | null)?.name ?? "Unassigned",
      slotCount: klass.timetable?.length ?? 0,
    })),
    staffWorkload: staff.map((member) => ({
      id: String(member._id),
      name: member.name,
      subjects: subjectCounts.get(String(member._id)) ?? 0,
      classTeacherOf: teacherClassCounts.get(String(member._id)) ?? 0,
      salary: member.staffMeta?.basicSalary ?? 0,
    })),
    controls: {
      unassignedClasses: classes.filter((klass) => !klass.classTeacherId).length,
      unassignedSubjects: subjects.filter((subject) => !subject.teacherId).length,
      classesWithoutTimetable: classes.filter((klass) => !klass.timetable?.length).length,
    },
    recentActivity,
  };
}

export async function getInstituteReportsData() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const [attendance, gradeRows, enrollments, finance, submissions, quizAttempts, financeTrend] = await Promise.all([
    AttendanceModel.aggregate([
      { $match: { instituteId: new mongoose.Types.ObjectId(session.instituteId as string) } },
      { $unwind: "$records" },
      {
        $group: {
          _id: "$records.status",
          total: { $sum: 1 },
        },
      },
    ]),
    MarksModel.find(withTenantScope({}, session)).populate("examId", "maxMarks").lean(),
    EnrollmentModel.aggregate([
      { $match: { instituteId: new mongoose.Types.ObjectId(session.instituteId as string) } },
      { $group: { _id: "$status", total: { $sum: 1 } } },
    ]),
    getIncomeStatistics(),
    SubmissionModel.countDocuments(withTenantScope({ status: "submitted" }, session)),
    QuizAttemptModel.countDocuments(withTenantScope({ status: "submitted" }, session)),
    getFinanceTrend(),
  ]);

  const attendanceTotal = attendance.reduce((sum, row) => sum + row.total, 0);
  const presentTotal = attendance
    .filter((row) => ["present", "late"].includes(row._id))
    .reduce((sum, row) => sum + row.total, 0);

  const gradeTotal = gradeRows.reduce((sum, mark) => {
    const exam = mark.examId as unknown as { maxMarks?: number } | null;
    return sum + (exam?.maxMarks ? (mark.marksObtained / exam.maxMarks) * 100 : 0);
  }, 0);

  return {
    attendancePercent: attendanceTotal > 0 ? Math.round((presentTotal / attendanceTotal) * 100) : 0,
    averageExamPercent: gradeRows.length > 0 ? gradeTotal / gradeRows.length : null,
    enrollmentStatus: enrollments.map((row) => ({ status: row._id ?? "unknown", total: row.total })),
    finance,
    financeTrend,
    gradingBacklog: submissions + quizAttempts,
    exports: [
      { label: "Students CSV", href: "/api/reports/export/students?format=csv" },
      { label: "Students Excel", href: "/api/reports/export/students?format=xlsx" },
      { label: "Fees CSV", href: "/api/reports/export/fees?format=csv" },
      { label: "Fees Excel", href: "/api/reports/export/fees?format=xlsx" },
      { label: "Terms CSV", href: "/api/reports/export/terms?format=csv" },
      { label: "Calendar CSV", href: "/api/reports/export/calendar-events?format=csv" },
    ],
  };
}
