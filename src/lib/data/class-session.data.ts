import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import ClassModel from "@/models/Class";
import UserModel from "@/models/User";
import ClassAttemptModel, { type ClassAttemptAttendance } from "@/models/ClassAttempt";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getActiveSession(classId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const klass = await ClassModel.findOne(withTenantScope({ _id: classId }, session)).lean();
  if (!klass || klass.classTeacherId?.toString() !== session.userId) return null;

  const students = await UserModel.find({
    instituteId: session.instituteId,
    role: "student",
    "studentMeta.classId": classId,
  })
    .select("name studentMeta.rollNumber")
    .sort({ name: 1 })
    .lean();

  const attempts = await ClassAttemptModel.find({ classId, date: startOfToday() }).lean();
  const attemptByStudent = new Map(attempts.map((attempt) => [attempt.studentId.toString(), attempt]));

  return {
    class: klass,
    roster: students.map((student) => {
      const attempt = attemptByStudent.get(student._id.toString());
      return {
        id: student._id.toString(),
        name: student.name,
        rollNumber: student.studentMeta?.rollNumber ?? "",
        joined: attempt?.status === "active",
        attendance: (attempt?.attendance ?? "pending") as ClassAttemptAttendance,
        joinedAt: attempt?.joinedAt ?? null,
        leftAt: attempt?.leftAt ?? null,
      };
    }),
  };
}

export async function getSessionStatusForStudent(classId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const student = await UserModel.findById(session.userId).select("studentMeta.classId").lean();
  if (!student || student.studentMeta?.classId?.toString() !== classId) return null;

  const klass = await ClassModel.findOne(withTenantScope({ _id: classId }, session)).lean();
  if (!klass) return null;

  const attempt = await ClassAttemptModel.findOne({
    classId,
    studentId: session.userId,
    date: startOfToday(),
  }).lean();

  return {
    class: klass,
    attempt: attempt
      ? {
          status: attempt.status,
          attendance: attempt.attendance,
          joinedAt: attempt.joinedAt,
          leftAt: attempt.leftAt,
        }
      : null,
  };
}
