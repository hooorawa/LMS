"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import AttendanceModel from "@/models/Attendance";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { assertCanMarkAttendance } from "@/lib/actions/class-subject-ownership";
import { recordAuditEntry } from "@/lib/audit/log";
import { markAttendanceSchema } from "@/lib/validation/attendance.schema";

export type MarkAttendanceState = {
  error?: string;
  success?: boolean;
};

export async function markAttendance(
  _prevState: MarkAttendanceState,
  formData: FormData
): Promise<MarkAttendanceState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const rawRecords = formData.get("records");
  let recordsInput: unknown = [];
  if (typeof rawRecords === "string" && rawRecords.length > 0) {
    try {
      recordsInput = JSON.parse(rawRecords);
    } catch {
      recordsInput = [];
    }
  }

  const parsed = markAttendanceSchema.safeParse({
    classId: formData.get("classId"),
    subjectId: formData.get("subjectId"),
    date: formData.get("date"),
    records: recordsInput,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { classId, subjectId, date, records } = parsed.data;
  const subjectIdOrNull = subjectId || null;

  await connectToDatabase();

  const owned = await assertCanMarkAttendance(classId, subjectIdOrNull, session);
  if (!owned) {
    return { error: "You cannot mark attendance for this class." };
  }

  const attendanceDate = new Date(date);
  if (Number.isNaN(attendanceDate.getTime())) {
    return { error: "Invalid date." };
  }

  await AttendanceModel.findOneAndUpdate(
    { classId, subjectId: subjectIdOrNull, date: attendanceDate },
    {
      instituteId: session.instituteId,
      classId,
      subjectId: subjectIdOrNull,
      date: attendanceDate,
      records,
      markedBy: session.userId,
    },
    { upsert: true, new: true }
  );

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "attendance.mark",
    targetType: "Attendance",
    targetId: classId,
    targetName: owned.class.name,
    summary: `Marked attendance for "${owned.class.name}" on ${date}`,
    metadata: { classId, subjectId: subjectIdOrNull, date, studentCount: records.length },
  });

  revalidatePath(`/attendance/${classId}`);

  return { success: true };
}
