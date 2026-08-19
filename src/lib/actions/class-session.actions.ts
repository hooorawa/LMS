"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import ClassModel from "@/models/Class";
import UserModel from "@/models/User";
import AttendanceModel, { type AttendanceStatus } from "@/models/Attendance";
import ClassAttemptModel from "@/models/ClassAttempt";
import NotificationModel from "@/models/Notification";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { startOfToday } from "@/lib/data/class-session.data";
import {
  classSessionIdSchema,
  markAttemptAttendanceSchema,
} from "@/lib/validation/class-session.schema";

export type ClassSessionState = {
  error?: string;
  success?: boolean;
};

async function loadOwnedClass(classId: string, session: Awaited<ReturnType<typeof requireSession>>) {
  const klass = await ClassModel.findOne(withTenantScope({ _id: classId }, session));
  if (!klass || klass.classTeacherId?.toString() !== session.userId) return null;
  return klass;
}

export async function startClass(
  _prevState: ClassSessionState,
  formData: FormData
): Promise<ClassSessionState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const parsed = classSessionIdSchema.safeParse({ classId: formData.get("classId") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const klass = await loadOwnedClass(parsed.data.classId, session);
  if (!klass) {
    return { error: "You cannot manage this class." };
  }

  if (klass.sessionStatus !== "ongoing") {
    klass.sessionStatus = "ongoing";
    klass.breakStatus = "none";
    klass.breaks = [];
    klass.totalBreakDuration = 0;
    await klass.save();

    const actor = await UserModel.findById(session.userId).select("name");
    await recordAuditEntry({
      session,
      actorName: actor?.name ?? "Unknown",
      action: "class_session.start",
      targetType: "Class",
      targetId: klass._id.toString(),
      targetName: klass.name,
      summary: `Started live session for "${klass.name}"`,
    });
  }

  revalidatePath(`/classes/${klass._id.toString()}/session`);
  return { success: true };
}

export async function startBreak(
  _prevState: ClassSessionState,
  formData: FormData
): Promise<ClassSessionState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const parsed = classSessionIdSchema.safeParse({ classId: formData.get("classId") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const klass = await loadOwnedClass(parsed.data.classId, session);
  if (!klass) {
    return { error: "You cannot manage this class." };
  }
  if (klass.sessionStatus !== "ongoing") {
    return { error: "Class session is not ongoing." };
  }
  if (klass.breakStatus === "on_break") {
    return { error: "Already on break." };
  }

  klass.breakStatus = "on_break";
  klass.breaks.push({ startTime: new Date(), endTime: null, duration: 0 });
  await klass.save();

  revalidatePath(`/classes/${klass._id.toString()}/session`);
  return { success: true };
}

export async function endBreak(
  _prevState: ClassSessionState,
  formData: FormData
): Promise<ClassSessionState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const parsed = classSessionIdSchema.safeParse({ classId: formData.get("classId") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const klass = await loadOwnedClass(parsed.data.classId, session);
  if (!klass) {
    return { error: "You cannot manage this class." };
  }
  if (klass.breakStatus !== "on_break") {
    return { error: "Not currently on break." };
  }

  const currentBreak = klass.breaks[klass.breaks.length - 1];
  const endTime = new Date();
  const durationMinutes = Math.max(
    0,
    Math.round((endTime.getTime() - currentBreak.startTime.getTime()) / 60_000)
  );
  currentBreak.endTime = endTime;
  currentBreak.duration = durationMinutes;
  klass.totalBreakDuration += durationMinutes;
  klass.breakStatus = "none";
  await klass.save();

  revalidatePath(`/classes/${klass._id.toString()}/session`);
  return { success: true };
}

export async function endClass(
  _prevState: ClassSessionState,
  formData: FormData
): Promise<ClassSessionState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const parsed = classSessionIdSchema.safeParse({ classId: formData.get("classId") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const klass = await loadOwnedClass(parsed.data.classId, session);
  if (!klass) {
    return { error: "You cannot manage this class." };
  }
  if (klass.sessionStatus !== "ongoing") {
    return { error: "Class session is not ongoing." };
  }

  if (klass.breakStatus === "on_break") {
    const currentBreak = klass.breaks[klass.breaks.length - 1];
    const endTime = new Date();
    const durationMinutes = Math.max(
      0,
      Math.round((endTime.getTime() - currentBreak.startTime.getTime()) / 60_000)
    );
    currentBreak.endTime = endTime;
    currentBreak.duration = durationMinutes;
    klass.totalBreakDuration += durationMinutes;
    klass.breakStatus = "none";
  }

  klass.sessionStatus = "completed";
  await klass.save();

  const classId = klass._id.toString();
  const today = startOfToday();

  const [students, attempts] = await Promise.all([
    UserModel.find({
      instituteId: session.instituteId,
      role: "student",
      "studentMeta.classId": classId,
    })
      .select("_id")
      .lean(),
    ClassAttemptModel.find({ classId, date: today }),
  ]);

  const attemptByStudent = new Map(attempts.map((attempt) => [attempt.studentId.toString(), attempt]));
  const now = new Date();

  for (const attempt of attempts) {
    if (attempt.status === "active") {
      attempt.status = "left";
      attempt.leftAt = now;
    }
    if (attempt.attendance === "pending") {
      attempt.attendance = "absent";
      attempt.attendanceMarkedAt = now;
    }
    await attempt.save();
  }

  const records = students.map((student) => {
    const studentId = student._id.toString();
    const attempt = attemptByStudent.get(studentId);
    const status: AttendanceStatus = attempt?.attendance === "attended" ? "present" : "absent";
    return { studentId, status };
  });

  if (records.length > 0) {
    await AttendanceModel.findOneAndUpdate(
      { classId, subjectId: null, date: today },
      {
        instituteId: session.instituteId,
        classId,
        subjectId: null,
        date: today,
        records,
        markedBy: session.userId,
      },
      { upsert: true, new: true }
    );
  }

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "class_session.end",
    targetType: "Class",
    targetId: classId,
    targetName: klass.name,
    summary: `Ended live session for "${klass.name}"`,
    metadata: { studentCount: records.length },
  });

  revalidatePath(`/classes/${classId}/session`);
  revalidatePath(`/attendance/${classId}`);
  return { success: true };
}

export async function cancelClassSession(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const parsed = classSessionIdSchema.safeParse({ classId: formData.get("classId") });
  if (!parsed.success) return;

  await connectToDatabase();

  const klass = await loadOwnedClass(parsed.data.classId, session);
  if (!klass) return;

  klass.sessionStatus = "cancelled";
  klass.breakStatus = "none";
  await klass.save();

  const students = await UserModel.find({
    instituteId: session.instituteId,
    role: "student",
    "studentMeta.classId": klass._id,
    "notificationPreferences.academic": { $ne: false },
  }).select("_id");

  await NotificationModel.insertMany(
    students.map((student) => ({
      instituteId: session.instituteId,
      userId: student._id,
      type: "academic",
      title: `Class cancelled: ${klass.name}`,
      body: "Your class session has been cancelled. Check your calendar for updates.",
      link: "/calendar",
    })),
    { ordered: false }
  ).catch(() => null);

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "class_session.cancel",
    targetType: "Class",
    targetId: klass._id.toString(),
    targetName: klass.name,
    summary: `Cancelled class session for "${klass.name}"`,
    metadata: { notifiedStudents: students.length },
  });

  revalidatePath("/workspace");
  revalidatePath(`/classes/${klass._id.toString()}/session`);
}

export async function joinClass(
  _prevState: ClassSessionState,
  formData: FormData
): Promise<ClassSessionState> {
  const session = await requireSession();
  requireRole(session, ["student"]);

  const parsed = classSessionIdSchema.safeParse({ classId: formData.get("classId") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { classId } = parsed.data;

  await connectToDatabase();

  const student = await UserModel.findById(session.userId).select("studentMeta.classId");
  if (student?.studentMeta?.classId?.toString() !== classId) {
    return { error: "You are not enrolled in this class." };
  }

  const klass = await ClassModel.findOne(withTenantScope({ _id: classId }, session)).lean();
  if (!klass) {
    return { error: "Class not found." };
  }
  if (klass.sessionStatus !== "ongoing") {
    return { error: "This class session has not started yet." };
  }

  const today = startOfToday();
  const now = new Date();

  const existing = await ClassAttemptModel.findOne({ classId, studentId: session.userId, date: today });
  if (existing) {
    existing.status = "active";
    existing.leftAt = null;
    if (!existing.joinedAt) existing.joinedAt = now;
    await existing.save();
  } else {
    await ClassAttemptModel.create({
      instituteId: session.instituteId,
      classId,
      studentId: session.userId,
      date: today,
      status: "active",
      attendance: "pending",
      joinedAt: now,
    });
  }

  revalidatePath(`/classes/${classId}/join`);
  return { success: true };
}

export async function leaveClass(
  _prevState: ClassSessionState,
  formData: FormData
): Promise<ClassSessionState> {
  const session = await requireSession();
  requireRole(session, ["student"]);
  const parsed = classSessionIdSchema.safeParse({ classId: formData.get("classId") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await connectToDatabase();
  const attempt = await ClassAttemptModel.findOne({
    classId: parsed.data.classId,
    studentId: session.userId,
    date: startOfToday(),
    status: "active",
  });
  if (!attempt) return { error: "You have not joined this live session." };

  attempt.status = "left";
  attempt.leftAt = new Date();
  await attempt.save();
  revalidatePath(`/classes/${parsed.data.classId}/join`);
  return { success: true };
}

export async function markAttemptAttendance(
  _prevState: ClassSessionState,
  formData: FormData
): Promise<ClassSessionState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const parsed = markAttemptAttendanceSchema.safeParse({
    classId: formData.get("classId"),
    studentId: formData.get("studentId"),
    attendance: formData.get("attendance"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { classId, studentId, attendance } = parsed.data;

  await connectToDatabase();

  const klass = await loadOwnedClass(classId, session);
  if (!klass) {
    return { error: "You cannot manage this class." };
  }

  const today = startOfToday();
  const now = new Date();

  await ClassAttemptModel.findOneAndUpdate(
    { classId, studentId, date: today },
    {
      $set: { attendance, attendanceMarkedAt: now },
      $setOnInsert: {
        instituteId: session.instituteId,
        classId,
        studentId,
        date: today,
        status: "left",
        joinedAt: null,
      },
    },
    { upsert: true }
  );

  revalidatePath(`/classes/${classId}/session`);
  return { success: true };
}
