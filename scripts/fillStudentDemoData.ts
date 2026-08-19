import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import InstituteModel from "@/models/Institute";
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
import AnnouncementModel from "@/models/Announcement";
import ExamModel from "@/models/Exam";
import ExamRegistrationModel from "@/models/ExamRegistration";
import MarksModel from "@/models/Marks";
import GradeModel from "@/models/Grade";
import AttendanceModel from "@/models/Attendance";
import ClassAttemptModel from "@/models/ClassAttempt";
import FeeModel from "@/models/Fee";
import PaymentModel from "@/models/Payment";
import FeeConcessionModel from "@/models/FeeConcession";
import NotificationModel from "@/models/Notification";

const DEMO_TAG = "[DEMO:SANDUNI]";
const RECEIPT_PREFIX = "SANDUNI-DEMO";
const TODAY = new Date();
const ACADEMIC_YEAR = "2025/2026";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function daysAgo(days: number, hour = 9): Date {
  const date = new Date(TODAY);
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function daysFromNow(days: number, hour = 9): Date {
  const date = new Date(TODAY);
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function cleanupStudentDemoData(studentId: mongoose.Types.ObjectId, instituteId: mongoose.Types.ObjectId) {
  const demoPrefix = `^${escapeRegExp(DEMO_TAG)}`;
  const courses = await CourseModel.find({
    instituteId,
    title: new RegExp(demoPrefix),
  })
    .select("_id")
    .lean();
  const courseIds = courses.map((course) => course._id);

  const modules = await ModuleModel.find({ instituteId, courseId: { $in: courseIds } })
    .select("_id")
    .lean();
  const moduleIds = modules.map((module) => module._id);

  const lessons = await LessonModel.find({ instituteId, courseId: { $in: courseIds } })
    .select("_id")
    .lean();
  const lessonIds = lessons.map((lesson) => lesson._id);

  const assignments = await AssignmentModel.find({ instituteId, courseId: { $in: courseIds } })
    .select("_id")
    .lean();
  const assignmentIds = assignments.map((assignment) => assignment._id);

  const quizzes = await QuizModel.find({ instituteId, courseId: { $in: courseIds } })
    .select("_id")
    .lean();
  const quizIds = quizzes.map((quiz) => quiz._id);

  const quizQuestions = await QuizQuestionModel.find({ instituteId, quizId: { $in: quizIds } })
    .select("_id")
    .lean();
  const quizQuestionIds = quizQuestions.map((question) => question._id);

  const exams = await ExamModel.find({
    instituteId,
    title: new RegExp(demoPrefix),
  })
    .select("_id")
    .lean();
  const examIds = exams.map((exam) => exam._id);

  const fees = await FeeModel.find({
    instituteId,
    title: new RegExp(demoPrefix),
  })
    .select("_id")
    .lean();
  const feeIds = fees.map((fee) => fee._id);

  await Promise.all([
    GradeModel.deleteMany({
      instituteId,
      studentId,
      $or: [{ courseId: { $in: courseIds } }, { examId: { $in: examIds } }],
    }),
    MarksModel.deleteMany({ instituteId, studentId, examId: { $in: examIds } }),
    ExamRegistrationModel.deleteMany({ instituteId, studentId, examId: { $in: examIds } }),
    ExamModel.deleteMany({ instituteId, _id: { $in: examIds } }),
    SubmissionModel.deleteMany({ instituteId, studentId, assignmentId: { $in: assignmentIds } }),
    AssignmentModel.deleteMany({ instituteId, _id: { $in: assignmentIds } }),
    QuizAttemptModel.deleteMany({ instituteId, studentId, quizId: { $in: quizIds } }),
    QuizQuestionModel.deleteMany({ instituteId, _id: { $in: quizQuestionIds } }),
    QuizModel.deleteMany({ instituteId, _id: { $in: quizIds } }),
    EnrollmentModel.deleteMany({ instituteId, studentId, courseId: { $in: courseIds } }),
    LessonModel.deleteMany({ instituteId, _id: { $in: lessonIds } }),
    ModuleModel.deleteMany({ instituteId, _id: { $in: moduleIds } }),
    CourseModel.deleteMany({ instituteId, _id: { $in: courseIds } }),
    AttendanceModel.deleteMany({ instituteId, "records.studentId": studentId, date: { $gte: daysAgo(40) } }),
    ClassAttemptModel.deleteMany({ instituteId, studentId }),
    PaymentModel.deleteMany({ instituteId, studentId, receiptNumber: new RegExp(`^${RECEIPT_PREFIX}`) }),
    FeeConcessionModel.deleteMany({ instituteId, studentId, title: new RegExp(demoPrefix) }),
    FeeModel.deleteMany({ instituteId, _id: { $in: feeIds } }),
    NotificationModel.deleteMany({ instituteId, userId: studentId, title: new RegExp(demoPrefix) }),
    AnnouncementModel.deleteMany({ instituteId, title: new RegExp(demoPrefix) }),
  ]);
}

async function main() {
  const target = (process.argv[2] ?? "sanduni.rathnayake@students.nps.edu").toLowerCase();

  await connectToDatabase();

  const student = await UserModel.findOne({
    $or: [{ email: target }, { name: target }],
    role: "student",
  }).lean();

  if (!student || !student.instituteId || !student.studentMeta?.classId) {
    throw new Error(`Student not found or missing class: ${target}`);
  }

  const institute = await InstituteModel.findById(student.instituteId).lean();
  const klass = await ClassModel.findById(student.studentMeta.classId).lean();
  if (!institute || !klass) {
    throw new Error("Missing institute or class for student.");
  }

  const admin =
    (await UserModel.findOne({ instituteId: institute._id, role: "institute-admin" }).lean()) ??
    null;
  if (!admin) {
    throw new Error("No institute admin found for this student's institute.");
  }

  const subjects = await SubjectModel.find({
    instituteId: institute._id,
    classIds: klass._id,
  })
    .sort({ name: 1 })
    .lean();

  if (subjects.length === 0) {
    throw new Error("No subjects found for the student's class.");
  }

  await cleanupStudentDemoData(student._id, institute._id);

  const courseSummaries: Array<{ title: string; id: mongoose.Types.ObjectId }> = [];

  for (let i = 0; i < Math.min(3, subjects.length); i++) {
    const subject = subjects[i];
    const teacherId = subject.teacherId ?? admin._id;

    const course = await CourseModel.create({
      instituteId: institute._id,
      title: `${DEMO_TAG} ${subject.name} Journey`,
      description: `${DEMO_TAG} Seeded course content for ${student.name}.`,
      subjectId: subject._id,
      teacherId,
      classIds: [klass._id],
      status: "published",
      createdBy: admin._id,
    });

    const moduleA = await ModuleModel.create({
      instituteId: institute._id,
      courseId: course._id,
      title: `${DEMO_TAG} Foundations`,
      order: 1,
      createdBy: admin._id,
    });
    const moduleB = await ModuleModel.create({
      instituteId: institute._id,
      courseId: course._id,
      title: `${DEMO_TAG} Practice`,
      order: 2,
      createdBy: admin._id,
    });

    const lessons = await LessonModel.insertMany([
      {
        instituteId: institute._id,
        courseId: course._id,
        moduleId: moduleA._id,
        title: `${DEMO_TAG} Lesson 1`,
        type: "text",
        textBody: "Seeded lesson notes so the lesson reader has meaningful content.",
        durationSeconds: 720,
        order: 1,
        isPreview: true,
        createdBy: admin._id,
      },
      {
        instituteId: institute._id,
        courseId: course._id,
        moduleId: moduleA._id,
        title: `${DEMO_TAG} Lesson 2`,
        type: "text",
        textBody: "Second lesson with practice-oriented text for the student view.",
        durationSeconds: 900,
        order: 2,
        isPreview: false,
        createdBy: admin._id,
      },
      {
        instituteId: institute._id,
        courseId: course._id,
        moduleId: moduleB._id,
        title: `${DEMO_TAG} Guided exercise`,
        type: "link",
        contentUrl: "https://example.com/student-demo",
        durationSeconds: 1200,
        order: 3,
        isPreview: false,
        createdBy: admin._id,
      },
    ]);

    await ModuleModel.updateOne(
      { _id: moduleA._id },
      { $set: { lessonOrder: [lessons[0]._id, lessons[1]._id] } }
    );
    await ModuleModel.updateOne(
      { _id: moduleB._id },
      { $set: { lessonOrder: [lessons[2]._id] } }
    );
    await CourseModel.updateOne(
      { _id: course._id },
      { $set: { moduleOrder: [moduleA._id, moduleB._id] } }
    );

    await EnrollmentModel.create({
      instituteId: institute._id,
      courseId: course._id,
      studentId: student._id,
      enrolledAt: daysAgo(24 - i * 3),
      status: "active",
      progress: {
        completedLessonIds: i === 0 ? [lessons[0]._id, lessons[1]._id] : [lessons[0]._id],
        percentComplete: i === 0 ? 67 : i === 1 ? 42 : 25,
        lastAccessedAt: daysAgo(i + 1),
      },
      createdBy: admin._id,
    });

    const assignmentPast = await AssignmentModel.create({
      instituteId: institute._id,
      courseId: course._id,
      teacherId,
      title: `${DEMO_TAG} Reflection task`,
      instructions: "Write a short reflection to populate the student assignment and submission pages.",
      dueAt: daysAgo(4, 17),
      maxScore: 100,
      status: "published",
      createdBy: admin._id,
    });

    const assignmentFuture = await AssignmentModel.create({
      instituteId: institute._id,
      courseId: course._id,
      teacherId,
      title: `${DEMO_TAG} Upcoming worksheet`,
      instructions: "This future task keeps the student dashboard showing upcoming work.",
      dueAt: daysFromNow(5 + i, 17),
      maxScore: 100,
      status: "published",
      createdBy: admin._id,
    });

    const submission = await SubmissionModel.create({
      instituteId: institute._id,
      assignmentId: assignmentPast._id,
      courseId: course._id,
      studentId: student._id,
      textResponse: "This is a seeded submission for Sanduni so the UI has a completed assignment history.",
      submittedAt: daysAgo(3, 15),
      status: i === 2 ? "submitted" : "graded",
      grade:
        i === 2
          ? undefined
          : {
              score: 78 + i * 6,
              feedback: "Clear work. Add one more example and tighten the conclusion.",
              gradedBy: teacherId,
              gradedAt: daysAgo(2, 18),
            },
    });

    if (i !== 2) {
      await GradeModel.create({
        instituteId: institute._id,
        studentId: student._id,
        courseId: course._id,
        subjectId: subject._id,
        source: "assignment",
        sourceId: submission._id,
        score: 78 + i * 6,
        maxScore: 100,
        weight: 1,
        computedAt: daysAgo(2, 18),
      });
    }

    const quiz = await QuizModel.create({
      instituteId: institute._id,
      courseId: course._id,
      teacherId,
      title: `${DEMO_TAG} Quick quiz`,
      instructions: "Short quiz to populate the quiz list and result pages.",
      timeLimitMinutes: 15,
      status: "published",
      createdBy: admin._id,
    });

    const questions = await QuizQuestionModel.insertMany([
      {
        instituteId: institute._id,
        quizId: quiz._id,
        type: "mcq",
        prompt: "Which answer matches the main concept reviewed in class?",
        order: 1,
        points: 4,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctOptionIndex: 1,
      },
      {
        instituteId: institute._id,
        quizId: quiz._id,
        type: "truefalse",
        prompt: "The topic never changes when context changes.",
        order: 2,
        points: 3,
        correctBoolean: false,
      },
      {
        instituteId: institute._id,
        quizId: quiz._id,
        type: "short",
        prompt: "Give one example from daily life.",
        order: 3,
        points: 5,
        sampleAnswer: "A short subject-relevant example.",
      },
    ]);

    await QuizModel.updateOne(
      { _id: quiz._id },
      { $set: { questionOrder: questions.map((question) => question._id) } }
    );

    const attempt = await QuizAttemptModel.create({
      instituteId: institute._id,
      quizId: quiz._id,
      courseId: course._id,
      studentId: student._id,
      startedAt: daysAgo(1, 10),
      submittedAt: daysAgo(1, 10),
      expiresAt: daysAgo(1, 10 + 1),
      status: "graded",
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
          selectedBoolean: false,
          isCorrect: true,
          pointsAwarded: 3,
          needsManualGrade: false,
        },
        {
          questionId: questions[2]._id,
          type: "short",
          textAnswer: "A seeded short answer so the result and review pages have content.",
          isCorrect: null,
          pointsAwarded: 4,
          needsManualGrade: true,
        },
      ],
      autoGradedScore: 7,
      manualGradedScore: 4,
      totalScore: 11,
      maxScore: 12,
    });

    await GradeModel.create({
      instituteId: institute._id,
      studentId: student._id,
      courseId: course._id,
      subjectId: subject._id,
      source: "quiz",
      sourceId: attempt._id,
      score: 11,
      maxScore: 12,
      weight: 1,
      computedAt: daysAgo(1, 11),
    });

    await AnnouncementModel.create({
      instituteId: institute._id,
      courseId: course._id,
      classId: null,
      title: `${DEMO_TAG} ${subject.name} course update`,
      body: "New practice material has been added for Sanduni's demo view.",
      audience: "course",
      createdBy: teacherId,
      publishedAt: daysAgo(1, 8),
    });

    void assignmentFuture;
    courseSummaries.push({ title: course.title, id: course._id });
  }

  const examSubject = subjects[0];
  const exam = await ExamModel.create({
    instituteId: institute._id,
    subjectId: examSubject._id,
    classId: klass._id,
    title: `${DEMO_TAG} ${examSubject.name} Assessment`,
    examDate: daysFromNow(8, 9),
    maxMarks: 100,
    term: "Term 2",
    academicYear: ACADEMIC_YEAR,
    createdBy: admin._id,
  });

  await ExamRegistrationModel.create({
    instituteId: institute._id,
    examId: exam._id,
    studentId: student._id,
    status: "registered",
    specialRequirements: "Preferred front-row seat.",
    registeredAt: daysAgo(2, 13),
  });

  const marks = await MarksModel.create({
    instituteId: institute._id,
    examId: exam._id,
    studentId: student._id,
    marksObtained: 86,
    grade: "A",
    remarks: "Strong understanding and neat presentation.",
    enteredBy: admin._id,
  });

  await GradeModel.create({
    instituteId: institute._id,
    studentId: student._id,
    courseId: null,
    subjectId: examSubject._id,
    examId: exam._id,
    source: "exam",
    sourceId: marks._id,
    score: 86,
    maxScore: 100,
    weight: 1,
    computedAt: daysAgo(0, 12),
  });

  for (let day = 1; day <= 7; day++) {
    await AttendanceModel.create({
      instituteId: institute._id,
      classId: klass._id,
      subjectId: day % 2 === 0 ? examSubject._id : null,
      date: daysAgo(day, 8),
      records: [
        {
          studentId: student._id,
          status: day === 3 ? "late" : day === 6 ? "absent" : "present",
        },
      ],
      markedBy: klass.classTeacherId ?? admin._id,
    });
  }

  await ClassAttemptModel.create({
    instituteId: institute._id,
    classId: klass._id,
    studentId: student._id,
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()),
    status: "active",
    attendance: "attended",
    joinedAt: daysAgo(0, 9),
    leftAt: null,
    attendanceMarkedAt: daysAgo(0, 10),
  });

  const fee = await FeeModel.create({
    instituteId: institute._id,
    classId: klass._id,
    studentId: null,
    title: `${DEMO_TAG} Term fee`,
    amount: 8500,
    dueDate: daysAgo(10, 9),
    academicYear: ACADEMIC_YEAR,
    frequency: "term",
    createdBy: admin._id,
  });

  await FeeConcessionModel.create({
    instituteId: institute._id,
    studentId: student._id,
    feeId: fee._id,
    title: `${DEMO_TAG} Merit concession`,
    type: "percent",
    value: 10,
    reason: "Seeded concession for the student fee overview.",
    startsAt: daysAgo(20),
    endsAt: daysFromNow(120),
    createdBy: admin._id,
  });

  await PaymentModel.create({
    instituteId: institute._id,
    studentId: student._id,
    feeId: fee._id,
    amount: 5000,
    paymentMethod: "bank-transfer",
    paymentDate: daysAgo(7, 11),
    receiptNumber: `${RECEIPT_PREFIX}-001`,
    recordedBy: admin._id,
    notes: "Partial payment so the balance view is not zero.",
  });

  await NotificationModel.insertMany([
    {
      instituteId: institute._id,
      userId: student._id,
      type: "academic",
      title: `${DEMO_TAG} New coursework available`,
      body: "Your seeded course content is ready to explore.",
      link: "/my-courses",
      isRead: false,
    },
    {
      instituteId: institute._id,
      userId: student._id,
      type: "announcement",
      title: `${DEMO_TAG} Teacher note`,
      body: "Check the latest course update and upcoming worksheet.",
      link: "/notifications",
      isRead: true,
    },
    {
      instituteId: institute._id,
      userId: student._id,
      type: "billing",
      title: `${DEMO_TAG} Fee reminder`,
      body: "A partial balance remains on your term fee.",
      link: `/fees/students/${student._id.toString()}/payments`,
      isRead: false,
    },
  ]);

  await UserModel.updateOne(
    { _id: student._id },
    {
      $set: {
        lastLoginAt: daysAgo(0, 12),
        phone: "0712345678",
      },
    }
  );

  console.log(`Seeded demo data for ${student.name} (${student.email})`);
  console.log(`Institute: ${institute.name} (${institute.code})`);
  console.log(`Courses created: ${courseSummaries.length}`);
  for (const course of courseSummaries) {
    console.log(`- ${course.title}`);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
