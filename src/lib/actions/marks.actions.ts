"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import MarksModel from "@/models/Marks";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { assertOwnsExam } from "@/lib/actions/class-subject-ownership";
import { recordAuditEntry } from "@/lib/audit/log";
import { recomputeGradeForSource } from "@/lib/data/grade-rollup";
import { enterMarksSchema } from "@/lib/validation/marks.schema";

export type EnterMarksState = {
  error?: string;
  success?: boolean;
};

export async function enterMarks(
  _prevState: EnterMarksState,
  formData: FormData
): Promise<EnterMarksState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const rawEntries = formData.get("entries");
  let entriesInput: unknown = [];
  if (typeof rawEntries === "string" && rawEntries.length > 0) {
    try {
      entriesInput = JSON.parse(rawEntries);
    } catch {
      entriesInput = [];
    }
  }

  const parsed = enterMarksSchema.safeParse({
    examId: formData.get("examId"),
    entries: entriesInput,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { examId, entries } = parsed.data;

  await connectToDatabase();

  const owned = await assertOwnsExam(examId, session);
  if (!owned) {
    return { error: "You cannot enter marks for this exam." };
  }
  const { exam } = owned;

  for (const entry of entries) {
    if (entry.marksObtained > exam.maxMarks) {
      return { error: `Marks cannot exceed ${exam.maxMarks}.` };
    }
  }

  const marksDocs = await Promise.all(
    entries.map((entry) =>
      MarksModel.findOneAndUpdate(
        { examId, studentId: entry.studentId },
        {
          instituteId: session.instituteId,
          examId,
          studentId: entry.studentId,
          marksObtained: entry.marksObtained,
          remarks: entry.remarks || undefined,
          enteredBy: session.userId,
        },
        { upsert: true, new: true }
      )
    )
  );

  await Promise.all(
    marksDocs.map((doc) => recomputeGradeForSource("exam", doc._id.toString(), session))
  );

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "marks.enter",
    targetType: "Exam",
    targetId: examId,
    targetName: exam.title,
    summary: `Entered marks for "${exam.title}" (${entries.length} student${entries.length === 1 ? "" : "s"})`,
  });

  revalidatePath(`/exams/${examId}/marks`);

  return { success: true };
}
