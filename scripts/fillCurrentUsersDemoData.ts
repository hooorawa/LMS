import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { hashPassword } from "@/lib/auth/password";
import InstituteModel from "@/models/Institute";
import UserModel from "@/models/User";
import ClassModel from "@/models/Class";
import SubjectModel from "@/models/Subject";
import CourseModel from "@/models/Course";
import ModuleModel from "@/models/Module";
import LessonModel from "@/models/Lesson";
import EnrollmentModel from "@/models/Enrollment";
import AssignmentModel from "@/models/Assignment";
import SubmissionModel from "@/models/Submission";
import QuizModel from "@/models/Quiz";
import QuizQuestionModel from "@/models/QuizQuestion";
import QuizAttemptModel from "@/models/QuizAttempt";
import ExamModel from "@/models/Exam";
import ExamRegistrationModel from "@/models/ExamRegistration";
import MarksModel from "@/models/Marks";
import GradeModel from "@/models/Grade";
import AttendanceModel from "@/models/Attendance";
import ClassAttemptModel from "@/models/ClassAttempt";
import FeeModel from "@/models/Fee";
import PaymentModel from "@/models/Payment";
import FeeConcessionModel from "@/models/FeeConcession";
import ExtraIncomeModel from "@/models/ExtraIncome";
import ExpenseModel from "@/models/Expense";
import AcademicTermModel from "@/models/AcademicTerm";
import AcademicEventModel from "@/models/AcademicEvent";
import AnnouncementModel from "@/models/Announcement";
import NotificationModel from "@/models/Notification";
import StudentFollowUpModel from "@/models/StudentFollowUp";
import AuditLogModel from "@/models/AuditLog";
import SubscriptionPlanModel from "@/models/SubscriptionPlan";
import SubscriptionModel from "@/models/Subscription";
import PlatformInvoiceModel from "@/models/PlatformInvoice";
import SystemSettingsModel from "@/models/SystemSettings";

const DEMO_PASSWORD = "Password123!";
const DAY_MS = 24 * 60 * 60 * 1000;
const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH_INDEX = TODAY.getMonth();
const CURRENT_MONTH = TODAY.toLocaleString("en-US", { month: "long" });
const ACADEMIC_YEAR = `${CURRENT_YEAR}/${CURRENT_YEAR + 1}`;
const RECEIPT_PREFIX = `RCPT-${CURRENT_YEAR}`;

// Tracks the record ids this script creates per institute so a re-run can
// cleanly replace last run's rows without relying on any marker text stored
// in the data itself (which would otherwise leak into the UI).
const MANIFEST_PATH = path.join(__dirname, ".seed-manifest.json");

type SeedManifestEntry = {
  classIds: string[];
  subjectIds: string[];
  courseIds: string[];
  examIds: string[];
  feeIds: string[];
  userIds: string[];
  extraIncomeIds: string[];
  expenseIds: string[];
  academicTermIds: string[];
  academicEventIds: string[];
  announcementIds: string[];
  notificationIds: string[];
  studentFollowUpIds: string[];
  auditLogIds: string[];
};

type SeedManifest = Record<string, SeedManifestEntry>;

function loadManifest(): SeedManifest {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as SeedManifest;
  } catch {
    return {};
  }
}

function saveManifest(manifest: SeedManifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

type ObjectId = mongoose.Types.ObjectId;

type LeanUser = {
  _id: ObjectId;
  name: string;
  email: string;
  role: "super-admin" | "institute-admin" | "institute-staff" | "student";
  instituteId: ObjectId | null;
  status: "active" | "suspended";
  lastLoginAt?: Date | null;
  studentMeta?: {
    classId?: ObjectId | null;
    rollNumber?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
  };
  staffMeta?: {
    employeeCode?: string | null;
    subjectIds?: ObjectId[];
    basicSalary?: number | null;
    commission?: number | null;
    monthlyCommissions?: Array<{ month: string; amount: number }>;
    permissions?: Record<string, boolean>;
  };
};

const SUBJECT_BLUEPRINTS = [
  { name: "Mathematics", suffix: "MATH", course: "Mathematics Mastery" },
  { name: "Science", suffix: "SCI", course: "Applied Science Lab" },
  { name: "English", suffix: "ENG", course: "English Communication" },
  { name: "ICT", suffix: "ICT", course: "Digital Skills Studio" },
];

const DEMO_STAFF_NAMES = [
  "Nethmi Perera",
  "Kasun Fernando",
  "Ishara Silva",
  "Ruwan Jayasinghe",
  "Ayesha De Mel",
];

const DEMO_STUDENT_NAMES = [
  "Amaya Perera",
  "Kavindu Silva",
  "Nethmi Fernando",
  "Sandaru Jayasuriya",
  "Thisari Peris",
  "Vihan Gunasekara",
  "Senuja Bandara",
  "Yasasmi Samarasinghe",
  "Dilshan Mendis",
  "Hasini Wickramasinghe",
  "Rivinu Abeywardena",
  "Oshadi Ranasinghe",
];

function asId(value: unknown): ObjectId {
  return value as ObjectId;
}

function daysAgo(days: number, hour = 9): Date {
  const date = new Date(TODAY.getTime() - days * DAY_MS);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function daysFromNow(days: number, hour = 9): Date {
  const date = new Date(TODAY.getTime() + days * DAY_MS);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function monthLabel(offset = 0): string {
  const date = new Date(CURRENT_YEAR, CURRENT_MONTH_INDEX + offset, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
}

function randomFrom<T>(items: T[], index: number): T {
  return items[index % items.length];
}

function receiptNumber(instituteCode: string, index: number) {
  return `${RECEIPT_PREFIX}-${instituteCode}-${String(index + 1).padStart(4, "0")}`;
}

async function ensureSystemSettings() {
  await SystemSettingsModel.updateOne(
    {},
    {
      $setOnInsert: {
        systemName: "LearningMS",
        tagline: "Manage classes, content, finance, and student progress in one place.",
        supportEmail: "support@learningms.test",
        defaultTrialDays: 14,
        primaryColor: "#0f766e",
        privacyPolicy:
          "We collect only the information needed to run your institute's classes, attendance, and billing. Data is never sold or shared with third parties outside of processing your payments and communications.",
        termsOfUse:
          "By using this platform you agree to keep your account credentials secure and to use the system in line with your institute's policies. Accounts found in violation of these terms may be suspended.",
        helpCenterContent:
          "Need help? Start with the Settings page for account and billing questions, or reach out to your institute administrator for access requests.",
      },
    },
    { upsert: true }
  );
}

async function ensurePlans() {
  const defs = [
    {
      slug: "starter",
      name: "Starter",
      price: 49,
      billingInterval: "monthly" as const,
      sortOrder: 1,
    },
    {
      slug: "growth",
      name: "Growth",
      price: 99,
      billingInterval: "monthly" as const,
      sortOrder: 2,
    },
    {
      slug: "pro-yearly",
      name: "Pro Yearly",
      price: 999,
      billingInterval: "yearly" as const,
      sortOrder: 3,
    },
  ];

  const plans = new Map<string, { _id: ObjectId; name: string; price: number }>();

  for (const def of defs) {
    const plan = await SubscriptionPlanModel.findOneAndUpdate(
      { slug: def.slug },
      {
        $set: {
          name: def.name,
          description: `${def.name} plan for growing institutes.`,
          price: def.price,
          currency: "USD",
          billingInterval: def.billingInterval,
          limits: {
            maxStudents: null,
            maxStaff: null,
            maxClasses: null,
            maxSubjects: null,
            storageMb: null,
          },
          features: ["Academics", "Fees", "Attendance", "Reports"],
          isActive: true,
          isPublic: true,
          sortOrder: def.sortOrder,
        },
      },
      { upsert: true, new: true }
    ).lean();

    plans.set(def.slug, { _id: asId(plan!._id), name: plan!.name, price: plan!.price });
  }

  return plans;
}

// Matches the "[DEMO]"-prefixed content an earlier version of this script used
// to tag seeded rows. Kept only so a first run against a database seeded by
// that older version can find and remove those rows once; new runs identify
// their own rows via the manifest instead, so nothing user-facing is tagged.
const LEGACY_DEMO_MARKER = /^\[DEMO\]/;
const LEGACY_DEMO_CODE = /^DEMO-/;
const LEGACY_DEMO_EMAIL = /demo\./;

async function cleanupDemoData(instituteId: ObjectId, manifest: SeedManifest) {
  const previous = manifest[instituteId.toString()];
  const oid = (id: string) => new mongoose.Types.ObjectId(id);

  const dedupeIds = (...groups: ObjectId[][]) => {
    const seen = new Map<string, ObjectId>();
    for (const group of groups) {
      for (const id of group) seen.set(id.toString(), id);
    }
    return Array.from(seen.values());
  };

  const [
    legacyClasses,
    legacySubjects,
    legacyCourses,
    legacyExams,
    legacyFees,
    legacyUsers,
    legacyExtraIncome,
    legacyExpenses,
    legacyTerms,
    legacyEvents,
    legacyAnnouncements,
    legacyNotifications,
    legacyFollowUps,
    legacyAuditLogs,
  ] = await Promise.all([
    ClassModel.find({ instituteId, name: LEGACY_DEMO_MARKER }).select("_id").lean(),
    SubjectModel.find({ instituteId, code: LEGACY_DEMO_CODE }).select("_id").lean(),
    CourseModel.find({ instituteId, title: LEGACY_DEMO_MARKER }).select("_id").lean(),
    ExamModel.find({ instituteId, title: LEGACY_DEMO_MARKER }).select("_id").lean(),
    FeeModel.find({ instituteId, title: LEGACY_DEMO_MARKER }).select("_id").lean(),
    UserModel.find({ instituteId, email: LEGACY_DEMO_EMAIL }).select("_id").lean(),
    ExtraIncomeModel.find({ instituteId, title: LEGACY_DEMO_MARKER }).select("_id").lean(),
    ExpenseModel.find({ instituteId, type: LEGACY_DEMO_MARKER }).select("_id").lean(),
    AcademicTermModel.find({ instituteId, name: LEGACY_DEMO_MARKER }).select("_id").lean(),
    AcademicEventModel.find({ instituteId, title: LEGACY_DEMO_MARKER }).select("_id").lean(),
    AnnouncementModel.find({ instituteId, title: LEGACY_DEMO_MARKER }).select("_id").lean(),
    NotificationModel.find({ instituteId, title: LEGACY_DEMO_MARKER }).select("_id").lean(),
    StudentFollowUpModel.find({ instituteId, note: LEGACY_DEMO_MARKER }).select("_id").lean(),
    AuditLogModel.find({ instituteId, summary: LEGACY_DEMO_MARKER }).select("_id").lean(),
  ]);

  const classIds = dedupeIds(previous?.classIds.map(oid) ?? [], legacyClasses.map((c) => c._id));
  const subjectIds = dedupeIds(previous?.subjectIds.map(oid) ?? [], legacySubjects.map((s) => s._id));
  const courseIds = dedupeIds(previous?.courseIds.map(oid) ?? [], legacyCourses.map((c) => c._id));
  const examIds = dedupeIds(previous?.examIds.map(oid) ?? [], legacyExams.map((e) => e._id));
  const feeIds = dedupeIds(previous?.feeIds.map(oid) ?? [], legacyFees.map((f) => f._id));
  const demoUserIds = dedupeIds(previous?.userIds.map(oid) ?? [], legacyUsers.map((u) => u._id));
  const extraIncomeIds = dedupeIds(previous?.extraIncomeIds.map(oid) ?? [], legacyExtraIncome.map((e) => e._id));
  const expenseIds = dedupeIds(previous?.expenseIds.map(oid) ?? [], legacyExpenses.map((e) => e._id));
  const academicTermIds = dedupeIds(previous?.academicTermIds.map(oid) ?? [], legacyTerms.map((t) => t._id));
  const academicEventIds = dedupeIds(previous?.academicEventIds.map(oid) ?? [], legacyEvents.map((e) => e._id));
  const announcementIds = dedupeIds(previous?.announcementIds.map(oid) ?? [], legacyAnnouncements.map((a) => a._id));
  const notificationIds = dedupeIds(previous?.notificationIds.map(oid) ?? [], legacyNotifications.map((n) => n._id));
  const studentFollowUpIds = dedupeIds(previous?.studentFollowUpIds.map(oid) ?? [], legacyFollowUps.map((f) => f._id));
  const auditLogIds = dedupeIds(previous?.auditLogIds.map(oid) ?? [], legacyAuditLogs.map((a) => a._id));

  const modules = courseIds.length
    ? await ModuleModel.find({ instituteId, courseId: { $in: courseIds } }).select("_id").lean()
    : [];
  const moduleIds = modules.map((item) => item._id);

  const lessons = courseIds.length
    ? await LessonModel.find({ instituteId, courseId: { $in: courseIds } }).select("_id").lean()
    : [];
  const lessonIds = lessons.map((item) => item._id);

  const assignments = courseIds.length
    ? await AssignmentModel.find({ instituteId, courseId: { $in: courseIds } }).select("_id").lean()
    : [];
  const assignmentIds = assignments.map((item) => item._id);

  const quizzes = courseIds.length
    ? await QuizModel.find({ instituteId, courseId: { $in: courseIds } }).select("_id").lean()
    : [];
  const quizIds = quizzes.map((item) => item._id);

  const quizQuestions = quizIds.length
    ? await QuizQuestionModel.find({ instituteId, quizId: { $in: quizIds } }).select("_id").lean()
    : [];
  const quizQuestionIds = quizQuestions.map((item) => item._id);

  const subscriptions = await SubscriptionModel.find({ instituteId }).select("_id").lean();
  const subscriptionIds = subscriptions.map((item) => item._id);

  await Promise.all([
    SubmissionModel.deleteMany({ instituteId, assignmentId: { $in: assignmentIds } }),
    EnrollmentModel.deleteMany({ instituteId, courseId: { $in: courseIds } }),
    QuizAttemptModel.deleteMany({ instituteId, quizId: { $in: quizIds } }),
    QuizQuestionModel.deleteMany({ instituteId, _id: { $in: quizQuestionIds } }),
    QuizModel.deleteMany({ instituteId, _id: { $in: quizIds } }),
    AssignmentModel.deleteMany({ instituteId, _id: { $in: assignmentIds } }),
    LessonModel.deleteMany({ instituteId, _id: { $in: lessonIds } }),
    ModuleModel.deleteMany({ instituteId, _id: { $in: moduleIds } }),
    CourseModel.deleteMany({ instituteId, _id: { $in: courseIds } }),
    MarksModel.deleteMany({ instituteId, examId: { $in: examIds } }),
    GradeModel.deleteMany({
      instituteId,
      $or: [
        { courseId: { $in: courseIds } },
        { examId: { $in: examIds } },
        { studentId: { $in: demoUserIds } },
      ],
    }),
    ExamRegistrationModel.deleteMany({ instituteId, examId: { $in: examIds } }),
    ExamModel.deleteMany({ instituteId, _id: { $in: examIds } }),
    AttendanceModel.deleteMany({ instituteId, classId: { $in: classIds } }),
    ClassAttemptModel.deleteMany({ instituteId, classId: { $in: classIds } }),
    FeeConcessionModel.deleteMany({
      instituteId,
      $or: [{ feeId: { $in: feeIds } }, { studentId: { $in: demoUserIds } }],
    }),
    PaymentModel.deleteMany({
      instituteId,
      $or: [{ feeId: { $in: feeIds } }, { studentId: { $in: demoUserIds } }],
    }),
    FeeModel.deleteMany({ instituteId, _id: { $in: feeIds } }),
    ExtraIncomeModel.deleteMany({ instituteId, _id: { $in: extraIncomeIds } }),
    ExpenseModel.deleteMany({ instituteId, _id: { $in: expenseIds } }),
    AcademicTermModel.deleteMany({ instituteId, _id: { $in: academicTermIds } }),
    AcademicEventModel.deleteMany({ instituteId, _id: { $in: academicEventIds } }),
    AnnouncementModel.deleteMany({ instituteId, _id: { $in: announcementIds } }),
    NotificationModel.deleteMany({ instituteId, _id: { $in: notificationIds } }),
    StudentFollowUpModel.deleteMany({ instituteId, _id: { $in: studentFollowUpIds } }),
    AuditLogModel.deleteMany({ instituteId, _id: { $in: auditLogIds } }),
    PlatformInvoiceModel.deleteMany({ instituteId, subscriptionId: { $in: subscriptionIds } }),
    SubjectModel.deleteMany({ instituteId, _id: { $in: subjectIds } }),
    ClassModel.deleteMany({ instituteId, _id: { $in: classIds } }),
    UserModel.deleteMany({ instituteId, _id: { $in: demoUserIds } }),
  ]);
}

async function ensureInstituteUsers(institute: { _id: ObjectId; code: string; name: string }, passwordHash: string) {
  const users = (await UserModel.find({ instituteId: institute._id }).lean()) as unknown as LeanUser[];
  const admin = users.find((user) => user.role === "institute-admin");
  if (!admin) {
    throw new Error(`Institute ${institute.code} has no institute-admin user to anchor seeded data.`);
  }

  const staff = users.filter((user) => user.role === "institute-staff");
  const students = users.filter((user) => user.role === "student");

  const staffNeeded = Math.max(0, 3 - staff.length);
  const studentNeeded = Math.max(0, 12 - students.length);

  const newStaff: LeanUser[] = [];
  const newStudents: LeanUser[] = [];

  for (let i = 0; i < staffNeeded; i++) {
    const name = randomFrom(DEMO_STAFF_NAMES, i);
    const created = await UserModel.create({
      name,
      email: `${slugify(name)}.${i + 1}@${institute.code.toLowerCase()}.edu`,
      passwordHash,
      role: "institute-staff",
      instituteId: institute._id,
      status: i === staffNeeded - 1 && staffNeeded > 1 ? "suspended" : "active",
      mustChangePassword: false,
      phone: `07700000${i + 1}`,
      staffMeta: {
        employeeCode: `${institute.code}-T${i + 1}`,
        basicSalary: 65000 + i * 5000,
        commission: 4000 + i * 500,
        monthlyCommissions: [
          { month: monthLabel(-1), amount: 3500 + i * 400 },
          { month: monthLabel(0), amount: 2800 + i * 300 },
        ],
        permissions: {
          dashboard: true,
          staff: i === 0,
          students: true,
          subjects: true,
          classes: true,
          expenses: i === 0,
          salary: i === 0,
          income: i === 0,
        },
      },
      createdBy: admin._id,
      lastLoginAt: daysAgo(2 + i),
    });
    newStaff.push(created.toObject() as unknown as LeanUser);
  }

  for (let i = 0; i < studentNeeded; i++) {
    const name = randomFrom(DEMO_STUDENT_NAMES, i);
    const created = await UserModel.create({
      name,
      email: `${slugify(name)}.${i + 1}@${institute.code.toLowerCase()}.edu`,
      passwordHash,
      role: "student",
      instituteId: institute._id,
      status: "active",
      mustChangePassword: false,
      phone: `07100000${i + 1}`,
      studentMeta: {
        guardianName: `${name.split(" ")[0]} Guardian`,
        guardianPhone: `07200000${i + 1}`,
      },
      createdBy: admin._id,
      lastLoginAt: daysAgo((i % 5) + 1),
    });
    newStudents.push(created.toObject() as unknown as LeanUser);
  }

  const allStaff = [...staff, ...newStaff];
  const allStudents = [...students, ...newStudents];

  return { admin, staff: allStaff, students: allStudents };
}

async function seedInstitute(
  institute: { _id: ObjectId; code: string; name: string },
  plans: Map<string, { _id: ObjectId; name: string; price: number }>,
  passwordHash: string,
  manifest: SeedManifest
) {
  await cleanupDemoData(institute._id, manifest);

  const { admin, staff, students } = await ensureInstituteUsers(institute, passwordHash);

  const activeStaff = staff.filter((user) => user.status === "active");
  const classTeachers = activeStaff.length > 0 ? activeStaff : [admin];

  const classDocs = await ClassModel.insertMany([
    {
      instituteId: institute._id,
      name: "Grade 6",
      section: "A",
      academicYear: ACADEMIC_YEAR,
      timetable: [
        { day: "monday", startTime: "08:30", endTime: "10:00", room: "Room 01" },
        { day: "wednesday", startTime: "09:00", endTime: "10:30", room: "Room 01" },
      ],
      classTeacherId: classTeachers[0]._id,
      status: "active",
      sessionStatus: "ongoing",
      breakStatus: "none",
      createdBy: admin._id,
    },
    {
      instituteId: institute._id,
      name: "Grade 7",
      section: "B",
      academicYear: ACADEMIC_YEAR,
      timetable: [
        { day: "tuesday", startTime: "10:30", endTime: "12:00", room: "Lab 02" },
        { day: "thursday", startTime: "11:00", endTime: "12:30", room: "Lab 02" },
      ],
      classTeacherId: classTeachers[1 % classTeachers.length]._id,
      status: "active",
      createdBy: admin._id,
    },
    {
      instituteId: institute._id,
      name: "Grade 8",
      section: "A",
      academicYear: ACADEMIC_YEAR,
      timetable: [
        { day: "friday", startTime: "08:00", endTime: "09:30", room: "Hall 03" },
        { day: "saturday", startTime: "09:30", endTime: "11:00", room: "Hall 03" },
      ],
      classTeacherId: classTeachers[2 % classTeachers.length]._id,
      status: "active",
      createdBy: admin._id,
    },
  ]);

  const classes = classDocs.map((item) => item.toObject());

  for (let i = 0; i < students.length; i++) {
    const klass = classes[i % classes.length];
    const student = students[i];
    await UserModel.updateOne(
      { _id: student._id },
      {
        $set: {
          lastLoginAt: student.lastLoginAt ?? daysAgo((i % 6) + 1),
          phone: student.email.endsWith(`@${institute.code.toLowerCase()}.edu`)
            ? `0711000${String(i).padStart(3, "0")}`
            : undefined,
          "studentMeta.classId": klass._id,
          "studentMeta.rollNumber":
            student.studentMeta?.rollNumber ?? `${institute.code}-${String(i + 1).padStart(4, "0")}`,
          "studentMeta.guardianName":
            student.studentMeta?.guardianName ?? `${student.name.split(" ")[0]} Guardian`,
          "studentMeta.guardianPhone": student.studentMeta?.guardianPhone ?? "0771234567",
        },
      }
    );
  }

  const refreshedStudents = (await UserModel.find({
    instituteId: institute._id,
    role: "student",
  }).lean()) as unknown as LeanUser[];

  for (let i = 0; i < activeStaff.length; i++) {
    const member = activeStaff[i];
    if (!member) continue;

    await UserModel.updateOne(
      { _id: member._id },
      {
        $set: {
          lastLoginAt: daysAgo((i % 4) + 1),
          "staffMeta.employeeCode":
            member.staffMeta?.employeeCode ?? `${institute.code}-EMP-${i + 1}`,
          "staffMeta.basicSalary":
            member.staffMeta?.basicSalary && member.staffMeta.basicSalary > 0
              ? member.staffMeta.basicSalary
              : 65000 + i * 5000,
          "staffMeta.commission":
            member.staffMeta?.commission && member.staffMeta.commission > 0
              ? member.staffMeta.commission
              : 3000 + i * 500,
          "staffMeta.monthlyCommissions": [
            { month: monthLabel(-1), amount: 2200 + i * 250, recordedAt: daysAgo(30) },
            { month: monthLabel(0), amount: 1800 + i * 200, recordedAt: daysAgo(3) },
          ],
          "staffMeta.permissions": {
            dashboard: true,
            staff: i === 0,
            students: true,
            subjects: true,
            classes: true,
            expenses: i <= 1,
            salary: i === 0,
            income: i <= 1,
          },
        },
      }
    );
  }

  const subjectDocs = await Promise.all(
    SUBJECT_BLUEPRINTS.map((blueprint, index) =>
      SubjectModel.create({
        instituteId: institute._id,
        name: blueprint.name,
        code: `${blueprint.suffix}201`,
        teacherId: activeStaff[index % activeStaff.length]?._id ?? admin._id,
        classIds:
          index < 3
            ? [classes[index]._id]
            : [classes[0]._id, classes[1]._id, classes[2]._id],
        createdBy: admin._id,
      })
    )
  );

  for (const member of activeStaff) {
    const subjectIds = subjectDocs
      .filter((subject) => String(subject.teacherId) === String(member._id))
      .map((subject) => subject._id);
    await UserModel.updateOne(
      { _id: member._id },
      {
        $set: {
          "staffMeta.subjectIds": subjectIds,
        },
      }
    );
  }

  const courseDocs = [];
  const enrollmentDocs: Array<{ _id: ObjectId; courseId: ObjectId; studentId: ObjectId }> = [];
  const assignmentDocs: Array<{ _id: ObjectId; courseId: ObjectId; teacherId: ObjectId; maxScore: number }> = [];
  const quizDocs: Array<{ _id: ObjectId; courseId: ObjectId; teacherId: ObjectId }> = [];
  const gradeInserts: Array<Record<string, unknown>> = [];

  for (let i = 0; i < subjectDocs.length; i++) {
    const subject = subjectDocs[i];
    const blueprint = SUBJECT_BLUEPRINTS[i];
    const course = await CourseModel.create({
      instituteId: institute._id,
      title: blueprint.course,
      description: `Core ${blueprint.name.toLowerCase()} curriculum with guided lessons and practice activities.`,
      subjectId: subject._id,
      teacherId: subject.teacherId,
      classIds: subject.classIds,
      status: i === subjectDocs.length - 1 ? "draft" : "published",
      createdBy: admin._id,
    });
    courseDocs.push(course);

    const module1 = await ModuleModel.create({
      instituteId: institute._id,
      courseId: course._id,
      title: "Foundations",
      order: 1,
      createdBy: admin._id,
    });
    const module2 = await ModuleModel.create({
      instituteId: institute._id,
      courseId: course._id,
      title: "Applied Practice",
      order: 2,
      createdBy: admin._id,
    });

    const lessonBatch = await LessonModel.insertMany([
      {
        instituteId: institute._id,
        courseId: course._id,
        moduleId: module1._id,
        title: "Welcome and overview",
        type: "text",
        textBody: "An introduction to the topics covered in this module and how they connect to what you already know.",
        durationSeconds: 600,
        order: 1,
        isPreview: true,
        createdBy: admin._id,
      },
      {
        instituteId: institute._id,
        courseId: course._id,
        moduleId: module1._id,
        title: "Guided reading",
        type: "text",
        textBody: "Students review the concept and answer short reflections.",
        durationSeconds: 900,
        order: 2,
        isPreview: false,
        createdBy: admin._id,
      },
      {
        instituteId: institute._id,
        courseId: course._id,
        moduleId: module2._id,
        title: "Practice activity",
        type: "link",
        contentUrl: "https://example.com/practice-activity",
        durationSeconds: 1200,
        order: 3,
        isPreview: false,
        createdBy: admin._id,
      },
    ]);

    await ModuleModel.updateOne({ _id: module1._id }, { $set: { lessonOrder: [lessonBatch[0]._id, lessonBatch[1]._id] } });
    await ModuleModel.updateOne({ _id: module2._id }, { $set: { lessonOrder: [lessonBatch[2]._id] } });
    await CourseModel.updateOne({ _id: course._id }, { $set: { moduleOrder: [module1._id, module2._id] } });

    const targetStudents = refreshedStudents.filter((student) =>
      subject.classIds.some((classId: ObjectId) => String(classId) === String(student.studentMeta?.classId))
    );

    for (let studentIndex = 0; studentIndex < targetStudents.length; studentIndex++) {
      const student = targetStudents[studentIndex];
      const enrollment = await EnrollmentModel.create({
        instituteId: institute._id,
        courseId: course._id,
        studentId: student._id,
        enrolledAt: daysAgo(35 - studentIndex),
        status: "active",
        progress: {
          completedLessonIds: lessonBatch.slice(0, (studentIndex % 3) + 1).map((lesson) => lesson._id),
          percentComplete: 35 + (studentIndex % 5) * 12,
          lastAccessedAt: daysAgo(studentIndex % 5),
        },
        createdBy: admin._id,
      });
      enrollmentDocs.push({ _id: enrollment._id, courseId: course._id, studentId: student._id });
    }

    const assignmentPast = await AssignmentModel.create({
      instituteId: institute._id,
      courseId: course._id,
      teacherId: subject.teacherId,
      title: "Assignment 1",
      instructions: "Submit a written response with one example from class.",
      dueAt: daysAgo(5, 17),
      maxScore: 100,
      status: "published",
      createdBy: admin._id,
    });
    const assignmentUpcoming = await AssignmentModel.create({
      instituteId: institute._id,
      courseId: course._id,
      teacherId: subject.teacherId,
      title: "Assignment 2",
      instructions: "Prepare the next lesson task so the student dashboard shows a due item.",
      dueAt: daysFromNow(6, 17),
      maxScore: 100,
      status: "published",
      createdBy: admin._id,
    });
    assignmentDocs.push(
      { _id: assignmentPast._id, courseId: course._id, teacherId: asId(subject.teacherId), maxScore: 100 },
      { _id: assignmentUpcoming._id, courseId: course._id, teacherId: asId(subject.teacherId), maxScore: 100 }
    );

    const submittedStudents = targetStudents.slice(0, Math.max(1, Math.ceil(targetStudents.length * 0.7)));
    for (let studentIndex = 0; studentIndex < submittedStudents.length; studentIndex++) {
      const student = submittedStudents[studentIndex];
      const graded = studentIndex % 3 !== 0;
      const score = 68 + ((studentIndex + i) % 6) * 5;
      const submission = await SubmissionModel.create({
        instituteId: institute._id,
        assignmentId: assignmentPast._id,
        courseId: course._id,
        studentId: student._id,
        textResponse: "Here is my response covering the key points from the lesson with a supporting example.",
        submittedAt: daysAgo(4 - (studentIndex % 2), 14),
        status: graded ? "graded" : "submitted",
        grade: graded
          ? {
              score,
              feedback: "Good structure. Add one more example to strengthen the answer.",
              gradedBy: subject.teacherId,
              gradedAt: daysAgo(3, 18),
            }
          : undefined,
      });

      if (graded) {
        gradeInserts.push({
          instituteId: institute._id,
          studentId: student._id,
          courseId: course._id,
          subjectId: subject._id,
          source: "assignment",
          sourceId: submission._id,
          score,
          maxScore: 100,
          weight: 1,
          computedAt: daysAgo(3, 18),
        });
      }
    }

    const quiz = await QuizModel.create({
      instituteId: institute._id,
      courseId: course._id,
      teacherId: subject.teacherId,
      title: "Knowledge Check",
      instructions: "Answer each question before the timer runs out.",
      timeLimitMinutes: 20,
      status: "published",
      createdBy: admin._id,
    });
    quizDocs.push({ _id: quiz._id, courseId: course._id, teacherId: asId(subject.teacherId) });

    const questions = await QuizQuestionModel.insertMany([
      {
        instituteId: institute._id,
        quizId: quiz._id,
        type: "mcq",
        prompt: "Which option best matches the main concept from this module?",
        order: 1,
        points: 4,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctOptionIndex: 1,
      },
      {
        instituteId: institute._id,
        quizId: quiz._id,
        type: "truefalse",
        prompt: "The key idea should be applied the same way in every scenario.",
        order: 2,
        points: 3,
        correctBoolean: false,
      },
      {
        instituteId: institute._id,
        quizId: quiz._id,
        type: "short",
        prompt: "Write one real-world example connected to this lesson.",
        order: 3,
        points: 5,
        sampleAnswer: "A short example with accurate subject vocabulary.",
      },
    ]);
    await QuizModel.updateOne({ _id: quiz._id }, { $set: { questionOrder: questions.map((question) => question._id) } });

    const attemptedStudents = targetStudents.slice(0, Math.max(1, Math.ceil(targetStudents.length * 0.6)));
    for (let studentIndex = 0; studentIndex < attemptedStudents.length; studentIndex++) {
      const student = attemptedStudents[studentIndex];
      const needsManual = studentIndex % 2 === 0;
      const autoScore = 4 + (studentIndex % 2) * 3;
      const manualScore = needsManual ? 4 : 0;
      const totalScore = autoScore + manualScore;
      const attempt = await QuizAttemptModel.create({
        instituteId: institute._id,
        quizId: quiz._id,
        courseId: course._id,
        studentId: student._id,
        startedAt: daysAgo(2, 10),
        submittedAt: daysAgo(2, 10),
        expiresAt: daysAgo(2, 10 + 1),
        status: needsManual ? "graded" : "submitted",
        answers: [
          {
            questionId: questions[0]._id,
            type: "mcq",
            selectedOptionIndex: 1,
            isCorrect: true,
            pointsAwarded: 4,
            needsManualGrade: false,
          },
          {
            questionId: questions[1]._id,
            type: "truefalse",
            selectedBoolean: studentIndex % 2 === 0,
            isCorrect: studentIndex % 2 !== 0,
            pointsAwarded: studentIndex % 2 !== 0 ? 3 : 0,
            needsManualGrade: false,
          },
          {
            questionId: questions[2]._id,
            type: "short",
            textAnswer: "A brief written answer covering the required example and vocabulary.",
            isCorrect: null,
            pointsAwarded: needsManual ? 4 : 0,
            needsManualGrade: true,
          },
        ],
        autoGradedScore: autoScore,
        manualGradedScore: manualScore,
        totalScore,
        maxScore: 12,
      });

      if (needsManual) {
        gradeInserts.push({
          instituteId: institute._id,
          studentId: student._id,
          courseId: course._id,
          subjectId: subject._id,
          source: "quiz",
          sourceId: attempt._id,
          score: totalScore,
          maxScore: 12,
          weight: 1,
          computedAt: daysAgo(2, 11),
        });
      }
    }
  }

  const examIds: ObjectId[] = [];

  for (let classIndex = 0; classIndex < classes.length; classIndex++) {
    const klass = classes[classIndex];
    const klassStudents = refreshedStudents.filter(
      (student) => String(student.studentMeta?.classId) === String(klass._id)
    );
    const classSubject = subjectDocs[classIndex % subjectDocs.length];

    const exam = await ExamModel.create({
      instituteId: institute._id,
      subjectId: classSubject._id,
      classId: klass._id,
      title: `${classSubject.name} Term Test`,
      examDate: daysFromNow(10 + classIndex, 9),
      maxMarks: 100,
      term: "Term 1",
      academicYear: ACADEMIC_YEAR,
      createdBy: admin._id,
    });
    examIds.push(exam._id);

    for (let i = 0; i < klassStudents.length; i++) {
      const student = klassStudents[i];
      await ExamRegistrationModel.create({
        instituteId: institute._id,
        examId: exam._id,
        studentId: student._id,
        status: i === klassStudents.length - 1 ? "cancelled" : "registered",
        specialRequirements: i === 0 ? "Front-row seating requested." : undefined,
        registeredAt: daysAgo(6 + i),
        cancelledAt: i === klassStudents.length - 1 ? daysAgo(1) : null,
      });

      if (i < Math.max(1, klassStudents.length - 1)) {
        const marksValue = 58 + ((i + classIndex) % 7) * 6;
        const marks = await MarksModel.create({
          instituteId: institute._id,
          examId: exam._id,
          studentId: student._id,
          marksObtained: marksValue,
          grade: marksValue >= 75 ? "A" : marksValue >= 65 ? "B" : marksValue >= 50 ? "C" : "D",
          remarks: marksValue >= 75 ? "Excellent consistency." : "Keep revising the core concepts.",
          enteredBy: admin._id,
        });

        gradeInserts.push({
          instituteId: institute._id,
          studentId: student._id,
          courseId: null,
          subjectId: classSubject._id,
          examId: exam._id,
          source: "exam",
          sourceId: marks._id,
          score: marksValue,
          maxScore: 100,
          weight: 1,
          computedAt: daysAgo(1, 16),
        });
      }
    }
  }

  if (gradeInserts.length > 0) {
    await GradeModel.insertMany(gradeInserts);
  }

  for (let dayOffset = 1; dayOffset <= 8; dayOffset++) {
    for (let classIndex = 0; classIndex < classes.length; classIndex++) {
      const klass = classes[classIndex];
      const classSubject = subjectDocs[classIndex % subjectDocs.length];
      const klassStudents = refreshedStudents.filter(
        (student) => String(student.studentMeta?.classId) === String(klass._id)
      );

      await AttendanceModel.create({
        instituteId: institute._id,
        classId: klass._id,
        subjectId: dayOffset % 2 === 0 ? classSubject._id : null,
        date: daysAgo(dayOffset, 8),
        records: klassStudents.map((student, studentIndex) => ({
          studentId: student._id,
          status:
            studentIndex % 7 === 0
              ? "absent"
              : studentIndex % 5 === 0
                ? "late"
                : studentIndex % 9 === 0
                  ? "excused"
                  : "present",
        })),
        markedBy: asId(klass.classTeacherId),
      });
    }
  }

  const sessionClass = classes[0];
  const sessionStudents = refreshedStudents.filter(
    (student) => String(student.studentMeta?.classId) === String(sessionClass._id)
  );
  for (let i = 0; i < sessionStudents.length; i++) {
    const student = sessionStudents[i];
    await ClassAttemptModel.create({
      instituteId: institute._id,
      classId: sessionClass._id,
      studentId: student._id,
      date: new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()),
      status: i % 4 === 0 ? "left" : "active",
      attendance: i % 6 === 0 ? "absent" : i % 4 === 0 ? "attended" : "pending",
      joinedAt: i % 6 === 0 ? null : daysAgo(0, 8),
      leftAt: i % 4 === 0 ? daysAgo(0, 10) : null,
      attendanceMarkedAt: i % 3 === 0 ? daysAgo(0, 10) : null,
    });
  }

  const feeDocs = [];
  for (let i = 0; i < classes.length; i++) {
    const klass = classes[i];
    feeDocs.push(
      await FeeModel.create({
        instituteId: institute._id,
        classId: klass._id,
        studentId: null,
        title: `Term ${i + 1} Tuition`,
        amount: 8500 + i * 1500,
        dueDate: daysAgo(12 - i),
        academicYear: ACADEMIC_YEAR,
        frequency: "term",
        createdBy: admin._id,
      })
    );
  }

  let paymentIndex = 0;
  for (const fee of feeDocs) {
    const feeStudents = refreshedStudents.filter(
      (student) => String(student.studentMeta?.classId) === String(fee.classId)
    );
    for (let i = 0; i < feeStudents.length; i++) {
      const student = feeStudents[i];
      if (i % 3 === 2) {
        continue;
      }
      await PaymentModel.create({
        instituteId: institute._id,
        studentId: student._id,
        feeId: fee._id,
        amount: i % 4 === 0 ? fee.amount / 2 : fee.amount,
        paymentMethod: i % 2 === 0 ? "bank-transfer" : "cash",
        paymentDate: daysAgo(8 - (i % 4)),
        receiptNumber: receiptNumber(institute.code, paymentIndex++),
        recordedBy: admin._id,
        notes: i % 4 === 0 ? "Partial payment received; balance due on the remainder." : undefined,
      });
    }
  }

  for (let i = 0; i < Math.min(3, refreshedStudents.length); i++) {
    await FeeConcessionModel.create({
      instituteId: institute._id,
      studentId: refreshedStudents[i]._id,
      feeId: feeDocs[i % feeDocs.length]._id,
      title: "Scholarship",
      type: i % 2 === 0 ? "percent" : "fixed",
      value: i % 2 === 0 ? 10 : 1000,
      reason: "Merit-based scholarship award.",
      startsAt: daysAgo(20),
      endsAt: daysFromNow(120),
      createdBy: admin._id,
    });
  }

  const extraIncomeIds: ObjectId[] = [];
  const expenseIds: ObjectId[] = [];
  for (let i = 0; i < 6; i++) {
    const income = await ExtraIncomeModel.create({
      instituteId: institute._id,
      title: `Book sale ${i + 1}`,
      description: "Proceeds from the term book sale.",
      amount: 3000 + i * 450,
      year: String(CURRENT_YEAR),
      month: new Date(CURRENT_YEAR, CURRENT_MONTH_INDEX - i, 1).toLocaleString("en-US", {
        month: "long",
      }),
      createdBy: admin._id,
      createdAt: daysAgo(30 * i),
      updatedAt: daysAgo(30 * i),
    });
    extraIncomeIds.push(income._id);

    const expense = await ExpenseModel.create({
      instituteId: institute._id,
      year: String(CURRENT_YEAR),
      month: new Date(CURRENT_YEAR, CURRENT_MONTH_INDEX - i, 1).toLocaleString("en-US", {
        month: "long",
      }),
      type: `Utilities ${i + 1}`,
      price: 1800 + i * 300,
      createdBy: admin._id,
      createdAt: daysAgo(30 * i),
      updatedAt: daysAgo(30 * i),
    });
    expenseIds.push(expense._id);
  }

  const academicTermDocs = await AcademicTermModel.insertMany([
    {
      instituteId: institute._id,
      name: "Term 1",
      academicYear: ACADEMIC_YEAR,
      startsAt: new Date(CURRENT_YEAR, 0, 10),
      endsAt: new Date(CURRENT_YEAR, 3, 5),
      status: "completed",
      createdBy: admin._id,
    },
    {
      instituteId: institute._id,
      name: "Term 2",
      academicYear: ACADEMIC_YEAR,
      startsAt: new Date(CURRENT_YEAR, 4, 12),
      endsAt: new Date(CURRENT_YEAR, 7, 28),
      status: "active",
      createdBy: admin._id,
    },
    {
      instituteId: institute._id,
      name: "Term 3",
      academicYear: ACADEMIC_YEAR,
      startsAt: new Date(CURRENT_YEAR, 8, 10),
      endsAt: new Date(CURRENT_YEAR, 11, 5),
      status: "planned",
      createdBy: admin._id,
    },
  ]);

  const academicEventDocs = await AcademicEventModel.insertMany([
    {
      instituteId: institute._id,
      title: "Parent meeting",
      type: "event",
      startsAt: daysFromNow(4, 15),
      endsAt: daysFromNow(4, 17),
      description: "Meet teachers to discuss student progress this term.",
      createdBy: admin._id,
    },
    {
      instituteId: institute._id,
      title: "Mid-term exams",
      type: "exam",
      startsAt: daysFromNow(10, 9),
      endsAt: daysFromNow(12, 12),
      description: "Mid-term examinations across all subjects.",
      createdBy: admin._id,
    },
    {
      instituteId: institute._id,
      title: "Public holiday",
      type: "holiday",
      startsAt: daysFromNow(16, 0),
      endsAt: daysFromNow(16, 23),
      description: "Institute closed for the public holiday.",
      createdBy: admin._id,
    },
    {
      instituteId: institute._id,
      title: "Assignment checkpoint",
      type: "deadline",
      startsAt: daysFromNow(6, 17),
      description: "Deadline for the current assignment cycle.",
      createdBy: admin._id,
    },
  ]);

  const publishedCourse = courseDocs.find((course) => course.status === "published") ?? courseDocs[0];
  const announcementDocs = await AnnouncementModel.insertMany([
    {
      instituteId: institute._id,
      courseId: null,
      classId: null,
      title: "Welcome back",
      body: "Welcome back to the new term! Please check your class timetable and course materials.",
      audience: "institute",
      createdBy: admin._id,
      publishedAt: daysAgo(2),
    },
    {
      instituteId: institute._id,
      courseId: null,
      classId: classes[0]._id,
      title: "Class timetable reminder",
      body: "Remember to bring the required materials for the practical session.",
      audience: "class",
      createdBy: admin._id,
      publishedAt: daysAgo(1),
    },
    {
      instituteId: institute._id,
      courseId: publishedCourse._id,
      classId: null,
      title: "Course update",
      body: "A new practice activity has been added to the course.",
      audience: "course",
      createdBy: admin._id,
      publishedAt: daysAgo(0, 8),
    },
  ]);

  const notificationUsers = [admin, ...activeStaff.slice(0, 2), ...refreshedStudents.slice(0, 6)];
  const notificationDocs: Array<{ _id: ObjectId }> = [];
  for (let i = 0; i < notificationUsers.length; i++) {
    const user = notificationUsers[i];
    const created = await NotificationModel.insertMany([
      {
        instituteId: institute._id,
        userId: user._id,
        type: i % 3 === 0 ? "announcement" : i % 3 === 1 ? "academic" : "billing",
        title: "New update available",
        body: "There's a new update on your workspace. Check the latest activity for details.",
        link: "/notifications",
        isRead: i % 2 === 0,
      },
      {
        instituteId: institute._id,
        userId: user._id,
        type: user.role === "student" ? "academic" : "announcement",
        title: "Reminder",
        body: user.role === "student" ? "Check your upcoming assignments and exam dates." : "Review the latest classroom activity.",
        link: "/dashboard",
        isRead: false,
      },
    ]);
    notificationDocs.push(...created);
  }

  const studentFollowUpDocs: Array<{ _id: ObjectId }> = [];
  for (let i = 0; i < Math.min(5, refreshedStudents.length); i++) {
    const followUp = await StudentFollowUpModel.create({
      instituteId: institute._id,
      studentId: refreshedStudents[i]._id,
      classId: refreshedStudents[i].studentMeta?.classId ?? null,
      type: i % 2 === 0 ? "attendance" : "coursework",
      status: i % 3 === 0 ? "resolved" : "open",
      note: `Follow up with ${refreshedStudents[i].name} about recent performance.`,
      nextActionAt: i % 3 === 0 ? null : daysFromNow(i + 1, 14),
      createdBy: activeStaff[i % activeStaff.length]?._id ?? admin._id,
      createdAt: daysAgo(i + 1),
      updatedAt: daysAgo(i + 1),
    });
    studentFollowUpDocs.push(followUp);
  }

  const auditLogDocs = await AuditLogModel.insertMany([
    {
      instituteId: institute._id,
      actorUserId: admin._id,
      actorName: admin.name,
      actorRole: "institute-admin",
      action: "class.create",
      targetType: "Class",
      targetId: classes[0]._id,
      targetName: `${classes[0].name} ${classes[0].section}`,
      summary: "Created new class structure.",
      createdAt: daysAgo(3, 9),
    },
    {
      instituteId: institute._id,
      actorUserId: admin._id,
      actorName: admin.name,
      actorRole: "institute-admin",
      action: "subject.create",
      targetType: "Subject",
      targetId: subjectDocs[0]._id,
      targetName: subjectDocs[0].name,
      summary: "Added subjects and teacher assignments.",
      createdAt: daysAgo(3, 10),
    },
    {
      instituteId: institute._id,
      actorUserId: activeStaff[0]?._id ?? admin._id,
      actorName: activeStaff[0]?.name ?? admin.name,
      actorRole: "institute-staff",
      action: "assignment.grade",
      targetType: "Assignment",
      targetId: assignmentDocs[0]._id,
      targetName: "Assignment 1",
      summary: "Graded student submissions.",
      createdAt: daysAgo(2, 16),
    },
    {
      instituteId: institute._id,
      actorUserId: admin._id,
      actorName: admin.name,
      actorRole: "institute-admin",
      action: "payment.record",
      targetType: "Payment",
      targetId: new mongoose.Types.ObjectId(),
      targetName: "Payment batch",
      summary: "Recorded a batch of fee payments.",
      createdAt: daysAgo(1, 11),
    },
  ]);

  const planChoice =
    institute.code.length % 3 === 0
      ? plans.get("pro-yearly")
      : institute.code.length % 2 === 0
        ? plans.get("growth")
        : plans.get("starter");

  if (!planChoice) {
    throw new Error("Missing subscription plan.");
  }

  const subscription = await SubscriptionModel.findOneAndUpdate(
    { instituteId: institute._id },
    {
      $set: {
        planId: planChoice._id,
        status: institute.code.length % 4 === 0 ? "trialing" : "active",
        trialEndsAt: institute.code.length % 4 === 0 ? daysFromNow(5) : null,
        currentPeriodStart: daysAgo(20),
        currentPeriodEnd: daysFromNow(10),
        autoRenew: true,
        cancelledAt: null,
        suspendedAt: null,
        createdBy: admin._id,
      },
    },
    { upsert: true, new: true }
  ).lean();

  const invoiceStatuses = ["paid", "paid", "pending", "overdue"] as const;
  for (let i = 0; i < invoiceStatuses.length; i++) {
    const periodStart = new Date(CURRENT_YEAR, CURRENT_MONTH_INDEX - (3 - i), 1);
    const periodEnd = new Date(CURRENT_YEAR, CURRENT_MONTH_INDEX - (2 - i), 0);
    const issuedAt = new Date(CURRENT_YEAR, CURRENT_MONTH_INDEX - (3 - i), 3);
    const dueAt = new Date(CURRENT_YEAR, CURRENT_MONTH_INDEX - (3 - i), 10);
    const status = invoiceStatuses[i];
    await PlatformInvoiceModel.create({
      instituteId: institute._id,
      subscriptionId: subscription!._id,
      planId: planChoice._id,
      planNameSnapshot: planChoice.name,
      invoiceNumber: `INV-${institute.code}-${CURRENT_YEAR}-${i + 1}`,
      periodStart,
      periodEnd,
      amount: planChoice.price,
      currency: "USD",
      status,
      issuedAt,
      dueAt,
      paidAt: status === "paid" ? new Date(issuedAt.getTime() + 3 * DAY_MS) : null,
      paymentMethod: status === "paid" ? "bank-transfer" : undefined,
      receiptNumber: status === "paid" ? `RCPT-${institute.code}-${i + 1}` : undefined,
      notes: "Subscription invoice.",
      discountAmount: i === 0 ? 10 : 0,
      discountReason: i === 0 ? "Loyalty discount" : undefined,
      lastOverdueReminderAt: status === "overdue" ? daysAgo(2) : null,
      recordedBy: admin._id,
    });
  }

  manifest[institute._id.toString()] = {
    classIds: classes.map((klass) => klass._id.toString()),
    subjectIds: subjectDocs.map((subject) => subject._id.toString()),
    courseIds: courseDocs.map((course) => course._id.toString()),
    examIds: examIds.map((id) => id.toString()),
    feeIds: feeDocs.map((fee) => fee._id.toString()),
    userIds: [...staff, ...refreshedStudents].map((user) => user._id.toString()),
    extraIncomeIds: extraIncomeIds.map((id) => id.toString()),
    expenseIds: expenseIds.map((id) => id.toString()),
    academicTermIds: academicTermDocs.map((term) => term._id.toString()),
    academicEventIds: academicEventDocs.map((event) => event._id.toString()),
    announcementIds: announcementDocs.map((announcement) => announcement._id.toString()),
    notificationIds: notificationDocs.map((notification) => notification._id.toString()),
    studentFollowUpIds: studentFollowUpDocs.map((followUp) => followUp._id.toString()),
    auditLogIds: auditLogDocs.map((log) => log._id.toString()),
  };

  return {
    institute: institute.code,
    staff: activeStaff.length,
    students: refreshedStudents.length,
    classes: classes.length,
    subjects: subjectDocs.length,
    courses: courseDocs.length,
  };
}

async function main() {
  await connectToDatabase();

  await ensureSystemSettings();
  const plans = await ensurePlans();
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const institutes = await InstituteModel.find().select("_id code name").sort({ name: 1 }).lean();
  if (institutes.length === 0) {
    throw new Error("No institutes found. Create at least one institute and its admin before running this seed.");
  }

  const manifest = loadManifest();
  const summaries = [];
  for (const institute of institutes) {
    if (!institute.code) {
      continue;
    }
    const summary = await seedInstitute(
      { _id: asId(institute._id), code: institute.code, name: institute.name },
      plans,
      passwordHash,
      manifest
    );
    summaries.push(summary);
    saveManifest(manifest);
  }

  console.log("Current-user demo data seed complete.");
  console.log("");
  console.log(`Shared demo password for any support users created: ${DEMO_PASSWORD}`);
  console.log("");
  for (const summary of summaries) {
    console.log(
      `${summary.institute}: ${summary.staff} staff, ${summary.students} students, ${summary.classes} classes, ${summary.subjects} subjects, ${summary.courses} courses`
    );
  }
  console.log("");
  console.log("Run: npm run seed:fill-current");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
