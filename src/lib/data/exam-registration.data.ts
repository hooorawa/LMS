import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import ExamModel from "@/models/Exam";
import ExamRegistrationModel from "@/models/ExamRegistration";
import UserModel from "@/models/User";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";

export async function getExamRegistrationDataForStudent() {
  const session = await requireSession();
  requireRole(session, ["student"]);
  await connectToDatabase();

  const student = await UserModel.findById(session.userId).select("studentMeta.classId").lean();
  const classId = student?.studentMeta?.classId;
  const currentTime = new Date();
  if (!classId) return { exams: [], registrations: [], currentTime };

  const [exams, registrations] = await Promise.all([
    ExamModel.find(withTenantScope({ classId }, session))
      .populate("subjectId", "name code")
      .sort({ examDate: 1 })
      .lean(),
    ExamRegistrationModel.find({ instituteId: session.instituteId, studentId: session.userId })
      .populate({ path: "examId", select: "title examDate term academicYear", populate: { path: "subjectId", select: "name code" } })
      .sort({ registeredAt: -1 })
      .lean(),
  ]);

  return { exams, registrations, currentTime };
}
