import "server-only";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import AcademicEventModel from "@/models/AcademicEvent";
import AnnouncementModel from "@/models/Announcement";
import AssignmentModel from "@/models/Assignment";
import AttendanceModel, { type AttendanceRecord } from "@/models/Attendance";
import ClassModel from "@/models/Class";
import EnrollmentModel from "@/models/Enrollment";
import ExamModel from "@/models/Exam";
import ExamRegistrationModel from "@/models/ExamRegistration";
import FeeModel from "@/models/Fee";
import NotificationModel from "@/models/Notification";
import PaymentModel from "@/models/Payment";
import SubjectModel from "@/models/Subject";
import SubmissionModel from "@/models/Submission";
import UserModel from "@/models/User";

type ClassTimetableSlot = { day?: string; startTime?: string; endTime?: string; room?: string };

const WEEKDAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

function weekdayRank(day?: string | null) {
  const index = WEEKDAY_ORDER.indexOf((day ?? "").toLowerCase() as (typeof WEEKDAY_ORDER)[number]);
  return index >= 0 ? index : 99;
}

function sortTimetable<T extends { day?: string | null; startTime?: string | null }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const dayDiff = weekdayRank(a.day) - weekdayRank(b.day);
    if (dayDiff !== 0) return dayDiff;
    return (a.startTime ?? "").localeCompare(b.startTime ?? "");
  });
}

export type TimetableSlotSummary = {
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  className: string;
  subjectName?: string;
};

export type StudentFeatureSnapshot = {
  timetable: TimetableSlotSummary[];
  upcomingEvents: Array<{ id: string; title: string; type: string; startsAt: Date }>;
  upcomingExams: Array<{
    id: string;
    title: string;
    subject: string;
    examDate: Date;
    term: string;
    registrationStatus: "registered" | "not-registered";
  }>;
  upcomingDeadlines: Array<{
    id: string;
    courseId: string;
    title: string;
    courseTitle: string;
    dueAt: Date;
  }>;
  continueLearning: Array<{
    enrollmentId: string;
    courseId: string;
    title: string;
    percentComplete: number;
    status: string;
  }>;
  recentFeedback: Array<{
    id: string;
    assignmentTitle: string;
    courseTitle: string;
    score: number | null;
    feedback: string;
    gradedAt: Date | null;
  }>;
  recentAnnouncements: Array<{ id: string; title: string; audience: string; publishedAt: Date }>;
  recentNotifications: Array<{ id: string; title: string; type: string; createdAt: Date; isRead: boolean }>;
  attendanceTrend: Array<{ date: Date; status: string; className: string; subjectName: string | null }>;
  atRiskFlags: string[];
  overdueAssignmentCount: number;
  nextFeeDue: { title: string; dueDate: Date; balance: number } | null;
};

export async function getStudentFeatureSnapshot(): Promise<StudentFeatureSnapshot> {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const student = await UserModel.findById(session.userId).select("studentMeta.classId").lean();
  const classId = student?.studentMeta?.classId ?? null;
  const now = new Date();

  const enrollments = await EnrollmentModel.find({
    instituteId: session.instituteId,
    studentId: session.userId,
    status: "active",
  })
    .populate("courseId", "title")
    .sort({ "progress.lastAccessedAt": -1, createdAt: -1 })
    .lean();

  const courseIds = enrollments
    .map((enrollment) => {
      const course = enrollment.courseId as unknown as { _id?: mongoose.Types.ObjectId } | null;
      return course?._id;
    })
    .filter((value): value is mongoose.Types.ObjectId => Boolean(value));

  const [
    klass,
    upcomingEvents,
    upcomingExams,
    examRegistrations,
    assignments,
    submissions,
    announcements,
    notifications,
    attendanceDocs,
    applicableFees,
    payments,
  ] = await Promise.all([
    classId
      ? ClassModel.findOne(withTenantScope({ _id: classId }, session))
          .populate("classTeacherId", "name")
          .lean()
      : null,
    AcademicEventModel.find(withTenantScope({ startsAt: { $gte: now } }, session))
      .sort({ startsAt: 1 })
      .limit(6)
      .lean(),
    classId
      ? ExamModel.find(withTenantScope({ classId, examDate: { $gte: now } }, session))
          .populate("subjectId", "name")
          .sort({ examDate: 1 })
          .limit(6)
          .lean()
      : [],
    ExamRegistrationModel.find({
      instituteId: session.instituteId,
      studentId: session.userId,
    })
      .select("examId status")
      .lean(),
    courseIds.length
      ? AssignmentModel.find({
          instituteId: session.instituteId,
          courseId: { $in: courseIds },
          status: "published",
        })
          .populate("courseId", "title")
          .sort({ dueAt: 1 })
          .lean()
      : [],
    SubmissionModel.find({
      instituteId: session.instituteId,
      studentId: session.userId,
    })
      .populate("assignmentId", "title")
      .populate("courseId", "title")
      .sort({ submittedAt: -1 })
      .lean(),
    AnnouncementModel.find({
      instituteId: session.instituteId,
      $or: [
        { audience: "institute" },
        ...(classId ? [{ audience: "class", classId }] : []),
        ...(courseIds.length ? [{ audience: "course", courseId: { $in: courseIds } }] : []),
      ],
    })
      .sort({ publishedAt: -1 })
      .limit(5)
      .lean(),
    NotificationModel.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    AttendanceModel.find(withTenantScope({ "records.studentId": session.userId }, session))
      .populate("classId", "name")
      .populate("subjectId", "name")
      .sort({ date: -1 })
      .limit(8)
      .lean(),
    classId
      ? FeeModel.find({
          instituteId: session.instituteId,
          $or: [{ studentId: session.userId }, { classId, studentId: null }, { classId: null, studentId: null }],
        })
          .sort({ dueDate: 1 })
          .lean()
      : FeeModel.find({
          instituteId: session.instituteId,
          $or: [{ studentId: session.userId }, { classId: null, studentId: null }],
        })
          .sort({ dueDate: 1 })
          .lean(),
    PaymentModel.find({
      instituteId: session.instituteId,
      studentId: session.userId,
    })
      .select("feeId amount")
      .lean(),
  ]);

  const submissionByAssignmentId = new Map(
    submissions.map((submission) => [String(submission.assignmentId), submission])
  );
  const registeredExamIds = new Set(
    examRegistrations
      .filter((registration) => registration.status === "registered")
      .map((registration) => String(registration.examId))
  );

  const outstandingAssignments = assignments.filter(
    (assignment) => !submissionByAssignmentId.has(String(assignment._id))
  );
  const upcomingDeadlines = outstandingAssignments
    .filter((assignment) => assignment.dueAt >= now)
    .slice(0, 6)
    .map((assignment) => ({
      id: String(assignment._id),
      courseId: String((assignment.courseId as unknown as { _id?: unknown } | null)?._id ?? assignment.courseId),
      title: assignment.title,
      courseTitle:
        (assignment.courseId as unknown as { title?: string } | null)?.title ?? "Course",
      dueAt: assignment.dueAt,
    }));
  const overdueAssignmentCount = outstandingAssignments.filter(
    (assignment) => assignment.dueAt < now
  ).length;

  const paidByFee = new Map<string, number>();
  for (const payment of payments) {
    const feeId = payment.feeId ? String(payment.feeId) : null;
    if (!feeId) continue;
    paidByFee.set(feeId, (paidByFee.get(feeId) ?? 0) + payment.amount);
  }

  const nextFeeDue =
    applicableFees
      .map((fee) => ({
        title: fee.title,
        dueDate: fee.dueDate,
        balance: fee.amount - (paidByFee.get(String(fee._id)) ?? 0),
      }))
      .filter((fee) => fee.balance > 0)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0] ?? null;

  const attendanceTrend = attendanceDocs.map((doc) => {
    const record = (doc.records as AttendanceRecord[]).find(
      (entry) => entry.studentId.toString() === session.userId
    );
    return {
      date: doc.date,
      status: record?.status ?? "absent",
      className: (doc.classId as unknown as { name?: string } | null)?.name ?? "Class",
      subjectName: (doc.subjectId as unknown as { name?: string } | null)?.name ?? null,
    };
  });

  const presentCount = attendanceTrend.filter(
    (entry) => entry.status === "present" || entry.status === "late"
  ).length;
  const attendancePercent =
    attendanceTrend.length > 0 ? Math.round((presentCount / attendanceTrend.length) * 100) : 0;

  const atRiskFlags: string[] = [];
  if (attendanceTrend.length > 0 && attendancePercent < 75) {
    atRiskFlags.push(`Attendance is ${attendancePercent}%, below the 75% target.`);
  }
  if (overdueAssignmentCount > 0) {
    atRiskFlags.push(
      `${overdueAssignmentCount} assignment${overdueAssignmentCount === 1 ? "" : "s"} need follow-up.`
    );
  }
  if (nextFeeDue && nextFeeDue.dueDate.getTime() < now.getTime()) {
    atRiskFlags.push("A fee payment is overdue.");
  }

  return {
    timetable: sortTimetable(
      ((klass?.timetable ?? []) as ClassTimetableSlot[]).map((slot) => ({
        day: slot.day ?? "",
        startTime: slot.startTime ?? "",
        endTime: slot.endTime ?? "",
        room: slot.room ?? "",
        className: klass?.section ? `${klass.name} ${klass.section}` : (klass?.name ?? "Class"),
      }))
    ),
    upcomingEvents: upcomingEvents.map((event) => ({
      id: String(event._id),
      title: event.title,
      type: event.type,
      startsAt: event.startsAt,
    })),
    upcomingExams: upcomingExams.map((exam) => ({
      id: String(exam._id),
      title: exam.title,
      subject: (exam.subjectId as unknown as { name?: string } | null)?.name ?? "Subject",
      examDate: exam.examDate,
      term: exam.term ?? "Term assessment",
      registrationStatus: registeredExamIds.has(String(exam._id)) ? "registered" : "not-registered",
    })),
    upcomingDeadlines,
    continueLearning: enrollments
      .filter((enrollment) => enrollment.courseId)
      .slice(0, 4)
      .map((enrollment) => ({
        enrollmentId: String(enrollment._id),
        courseId: String((enrollment.courseId as { _id: unknown })._id),
        title: (enrollment.courseId as { title?: string }).title ?? "Course",
        percentComplete: enrollment.progress?.percentComplete ?? 0,
        status: enrollment.status,
      })),
    recentFeedback: submissions
      .filter((submission) => submission.status === "graded" && submission.grade?.feedback)
      .slice(0, 4)
      .map((submission) => ({
        id: String(submission._id),
        assignmentTitle:
          (submission.assignmentId as unknown as { title?: string } | null)?.title ?? "Assignment",
        courseTitle:
          (submission.courseId as unknown as { title?: string } | null)?.title ?? "Course",
        score: submission.grade?.score ?? null,
        feedback: submission.grade?.feedback ?? "",
        gradedAt: submission.grade?.gradedAt ?? null,
      })),
    recentAnnouncements: announcements.map((announcement) => ({
      id: String(announcement._id),
      title: announcement.title,
      audience: announcement.audience,
      publishedAt: announcement.publishedAt,
    })),
    recentNotifications: notifications.map((notification) => ({
      id: String(notification._id),
      title: notification.title,
      type: notification.type,
      createdAt: notification.createdAt,
      isRead: notification.isRead,
    })),
    attendanceTrend,
    atRiskFlags,
    overdueAssignmentCount,
    nextFeeDue,
  };
}

export type TeacherFeatureSnapshot = {
  teachingPlanner: TimetableSlotSummary[];
  gradingQueue: Array<{
    id: string;
    assignmentTitle: string;
    studentName: string;
    submittedAt: Date;
    courseId: string;
    assignmentId: string;
  }>;
  upcomingAssessments: Array<{
    id: string;
    title: string;
    className: string;
    subjectName: string;
    date: Date;
    kind: "exam" | "assignment";
  }>;
  atRiskStudents: Array<{
    studentId: string;
    name: string;
    className: string;
    attendancePercent: number;
  }>;
  recentAnnouncements: Array<{ id: string; title: string; audience: string; publishedAt: Date }>;
};

export async function getTeacherFeatureSnapshot(): Promise<TeacherFeatureSnapshot> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const now = new Date();

  const [subjects, classes, submissions, exams, assignments, announcements, students, attendanceRows] =
    await Promise.all([
      SubjectModel.find(withTenantScope({ teacherId: session.userId }, session))
        .populate("classIds", "name section timetable")
        .sort({ name: 1 })
        .lean(),
      ClassModel.find(withTenantScope({ classTeacherId: session.userId }, session)).lean(),
      SubmissionModel.find({
        instituteId: session.instituteId,
        status: "submitted",
      })
        .populate("assignmentId", "title teacherId courseId")
        .populate("studentId", "name")
        .sort({ submittedAt: 1 })
        .lean(),
      ExamModel.find({
        instituteId: session.instituteId,
        examDate: { $gte: now },
      })
        .populate("subjectId", "name teacherId")
        .populate("classId", "name section")
        .sort({ examDate: 1 })
        .lean(),
      AssignmentModel.find({
        instituteId: session.instituteId,
        teacherId: session.userId,
        status: "published",
        dueAt: { $gte: now },
      })
        .populate("courseId", "title classIds")
        .sort({ dueAt: 1 })
        .lean(),
      AnnouncementModel.find({
        instituteId: session.instituteId,
        createdBy: session.userId,
      })
        .sort({ publishedAt: -1 })
        .limit(5)
        .lean(),
      UserModel.find({
        instituteId: session.instituteId,
        role: "student",
      })
        .select("name studentMeta.classId")
        .lean(),
      AttendanceModel.aggregate([
        { $match: { instituteId: new mongoose.Types.ObjectId(session.instituteId as string) } },
        { $unwind: "$records" },
        {
          $group: {
            _id: {
              classId: "$classId",
              studentId: "$records.studentId",
            },
            total: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $in: ["$records.status", ["present", "late"]] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

  const subjectClassIds = new Set<string>();
  const plannerRows: TimetableSlotSummary[] = [];
  for (const subject of subjects) {
    const subjectName = subject.name;
    const subjectClasses = (subject.classIds ?? []) as unknown as Array<{
      _id: mongoose.Types.ObjectId;
      name: string;
      section?: string;
      timetable?: Array<{ day?: string; startTime?: string; endTime?: string; room?: string }>;
    }>;

    for (const klass of subjectClasses) {
      subjectClassIds.add(String(klass._id));
      for (const slot of (klass.timetable ?? []) as ClassTimetableSlot[]) {
        plannerRows.push({
          day: slot.day ?? "",
          startTime: slot.startTime ?? "",
          endTime: slot.endTime ?? "",
          room: slot.room ?? "",
          className: klass.section ? `${klass.name} ${klass.section}` : klass.name,
          subjectName,
        });
      }
    }
  }

  for (const klass of classes) {
    if (subjectClassIds.has(String(klass._id))) continue;
    for (const slot of klass.timetable ?? []) {
      plannerRows.push({
        day: slot.day ?? "",
        startTime: slot.startTime ?? "",
        endTime: slot.endTime ?? "",
        room: slot.room ?? "",
        className: klass.section ? `${klass.name} ${klass.section}` : klass.name,
        subjectName: "Class teacher",
      });
    }
  }

  const gradingQueue = submissions
    .filter((submission) => {
      const assignment = submission.assignmentId as unknown as { teacherId?: mongoose.Types.ObjectId } | null;
      return assignment?.teacherId?.toString() === session.userId;
    })
    .slice(0, 6)
    .map((submission) => ({
      id: String(submission._id),
      assignmentTitle:
        (submission.assignmentId as unknown as { title?: string; courseId?: mongoose.Types.ObjectId } | null)?.title ??
        "Assignment",
      studentName: (submission.studentId as unknown as { name?: string } | null)?.name ?? "Student",
      submittedAt: submission.submittedAt,
      courseId:
        String(
          (submission.assignmentId as unknown as { courseId?: mongoose.Types.ObjectId } | null)
            ?.courseId ?? ""
        ),
      assignmentId: String(
        (submission.assignmentId as unknown as { _id?: mongoose.Types.ObjectId } | null)?._id ?? ""
      ),
    }));

  const examRows = exams
    .filter((exam) => {
      const subject = exam.subjectId as unknown as { teacherId?: mongoose.Types.ObjectId } | null;
      return subject?.teacherId?.toString() === session.userId;
    })
    .slice(0, 4)
    .map((exam) => ({
      id: String(exam._id),
      title: exam.title,
      className:
        ((exam.classId as unknown as { name?: string; section?: string } | null)?.section
          ? `${(exam.classId as unknown as { name?: string; section?: string }).name} ${(exam.classId as unknown as { section?: string }).section}`
          : (exam.classId as unknown as { name?: string } | null)?.name) ?? "Class",
      subjectName: (exam.subjectId as unknown as { name?: string } | null)?.name ?? "Subject",
      date: exam.examDate,
      kind: "exam" as const,
    }));

  const assignmentRows = assignments.slice(0, 4).map((assignment) => ({
    id: String(assignment._id),
    title: assignment.title,
    className: "Course delivery",
    subjectName: (assignment.courseId as unknown as { title?: string } | null)?.title ?? "Course",
    date: assignment.dueAt,
    kind: "assignment" as const,
  }));

  const classNames = new Map<string, string>();
  for (const klass of classes) {
    classNames.set(
      String(klass._id),
      klass.section ? `${klass.name} ${klass.section}` : klass.name
    );
  }
  for (const subject of subjects) {
    for (const classId of subject.classIds as mongoose.Types.ObjectId[]) {
      if (classNames.has(String(classId))) continue;
    }
  }

  const trackedClassIds = new Set<string>([
    ...classes.map((klass) => String(klass._id)),
    ...subjects.flatMap((subject) =>
      (subject.classIds as mongoose.Types.ObjectId[]).map((id) => String(id))
    ),
  ]);

  const attendanceByStudent = new Map<string, { classId: string; percent: number }>();
  for (const row of attendanceRows as Array<{
    _id: { classId: mongoose.Types.ObjectId; studentId: mongoose.Types.ObjectId };
    total: number;
    present: number;
  }>) {
    const classId = String(row._id.classId);
    if (!trackedClassIds.has(classId) || row.total === 0) continue;
    const percent = Math.round((row.present / row.total) * 100);
    attendanceByStudent.set(String(row._id.studentId), { classId, percent });
  }

  const atRiskStudents = students
    .map((student) => {
      const summary = attendanceByStudent.get(String(student._id));
      if (!summary) return null;
      if (summary.percent >= 75) return null;
      return {
        studentId: String(student._id),
        name: student.name,
        className: classNames.get(summary.classId) ?? "Class",
        attendancePercent: summary.percent,
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .sort((a, b) => a.attendancePercent - b.attendancePercent)
    .slice(0, 6);

  return {
    teachingPlanner: sortTimetable(plannerRows),
    gradingQueue,
    upcomingAssessments: [...examRows, ...assignmentRows]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 6),
    atRiskStudents,
    recentAnnouncements: announcements.map((announcement) => ({
      id: String(announcement._id),
      title: announcement.title,
      audience: announcement.audience,
      publishedAt: announcement.publishedAt,
    })),
  };
}

export type AdminFeatureSnapshot = {
  academicEvents: Array<{ id: string; title: string; type: string; startsAt: Date }>;
  timetableCoverage: Array<{
    id: string;
    className: string;
    classTeacher: string;
    academicYear: string;
    slotCount: number;
  }>;
  upcomingExams: Array<{ id: string; title: string; className: string; subjectName: string; examDate: Date }>;
  financeSignals: {
    overdueFees: number;
    overdueAmount: number;
    unassignedSubjects: number;
    unassignedClasses: number;
  };
  recentAnnouncements: Array<{ id: string; title: string; audience: string; publishedAt: Date }>;
};

export async function getAdminFeatureSnapshot(): Promise<AdminFeatureSnapshot> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const now = new Date();
  const [events, classes, exams, subjects, fees, payments, announcements] = await Promise.all([
    AcademicEventModel.find(withTenantScope({ startsAt: { $gte: now } }, session))
      .sort({ startsAt: 1 })
      .limit(8)
      .lean(),
    ClassModel.find(withTenantScope({}, session))
      .populate("classTeacherId", "name")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    ExamModel.find(withTenantScope({ examDate: { $gte: now } }, session))
      .populate("subjectId", "name")
      .populate("classId", "name section")
      .sort({ examDate: 1 })
      .limit(6)
      .lean(),
    SubjectModel.find(withTenantScope({}, session)).select("teacherId").lean(),
    FeeModel.find(withTenantScope({}, session)).select("title amount dueDate").lean(),
    PaymentModel.find({ instituteId: session.instituteId }).select("feeId amount").lean(),
    AnnouncementModel.find(withTenantScope({}, session))
      .sort({ publishedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const paidByFee = new Map<string, number>();
  for (const payment of payments) {
    const feeId = payment.feeId ? String(payment.feeId) : null;
    if (!feeId) continue;
    paidByFee.set(feeId, (paidByFee.get(feeId) ?? 0) + payment.amount);
  }

  const overdueFees = fees.filter((fee) => {
    const balance = fee.amount - (paidByFee.get(String(fee._id)) ?? 0);
    return balance > 0 && fee.dueDate.getTime() < now.getTime();
  });

  return {
    academicEvents: events.map((event) => ({
      id: String(event._id),
      title: event.title,
      type: event.type,
      startsAt: event.startsAt,
    })),
    timetableCoverage: classes.map((klass) => ({
      id: String(klass._id),
      className: klass.section ? `${klass.name} ${klass.section}` : klass.name,
      classTeacher:
        (klass.classTeacherId as unknown as { name?: string } | null)?.name ?? "Unassigned",
      academicYear: klass.academicYear,
      slotCount: klass.timetable?.length ?? 0,
    })),
    upcomingExams: exams.map((exam) => ({
      id: String(exam._id),
      title: exam.title,
      className:
        ((exam.classId as unknown as { name?: string; section?: string } | null)?.section
          ? `${(exam.classId as unknown as { name?: string; section?: string }).name} ${(exam.classId as unknown as { section?: string }).section}`
          : (exam.classId as unknown as { name?: string } | null)?.name) ?? "Class",
      subjectName: (exam.subjectId as unknown as { name?: string } | null)?.name ?? "Subject",
      examDate: exam.examDate,
    })),
    financeSignals: {
      overdueFees: overdueFees.length,
      overdueAmount: overdueFees.reduce((sum, fee) => {
        const balance = fee.amount - (paidByFee.get(String(fee._id)) ?? 0);
        return sum + balance;
      }, 0),
      unassignedSubjects: subjects.filter((subject) => !subject.teacherId).length,
      unassignedClasses: classes.filter((klass) => !klass.classTeacherId).length,
    },
    recentAnnouncements: announcements.map((announcement) => ({
      id: String(announcement._id),
      title: announcement.title,
      audience: announcement.audience,
      publishedAt: announcement.publishedAt,
    })),
  };
}
