import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import ExamModel from "@/models/Exam";
import SubjectModel from "@/models/Subject";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export async function listExamsForInstitute() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ExamModel.find(withTenantScope({}, session))
    .populate("subjectId", "name")
    .populate("classId", "name section")
    .sort({ examDate: -1 })
    .lean();
}

export async function getExamForInstitute(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ExamModel.findOne(withTenantScope({ _id: id }, session)).lean();
}

export async function listExamsForTeacher() {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const subjects = await SubjectModel.find(
    withTenantScope({ teacherId: session.userId }, session)
  )
    .select("_id")
    .lean();
  const subjectIds = subjects.map((subject) => subject._id);

  if (subjectIds.length === 0) return [];

  return ExamModel.find({ instituteId: session.instituteId, subjectId: { $in: subjectIds } })
    .populate("subjectId", "name")
    .populate("classId", "name section")
    .sort({ examDate: -1 })
    .lean();
}
