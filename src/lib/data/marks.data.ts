import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import ExamModel from "@/models/Exam";
import SubjectModel from "@/models/Subject";
import UserModel from "@/models/User";
import MarksModel from "@/models/Marks";
import { requireSession, requireRole, assertSameInstitute } from "@/lib/tenant/scope";

export async function getMarksEntryContext(examId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const exam = await ExamModel.findById(examId).lean();
  if (!exam) return null;
  assertSameInstitute(exam, session);

  const subject = await SubjectModel.findById(exam.subjectId).lean();
  if (!subject || subject.teacherId?.toString() !== session.userId) {
    throw new Error("Resource not found");
  }

  const students = await UserModel.find({
    instituteId: session.instituteId,
    role: "student",
    "studentMeta.classId": exam.classId,
  })
    .select("name studentMeta.rollNumber")
    .sort({ name: 1 })
    .lean();

  const marks = await MarksModel.find({ examId }).lean();
  const marksByStudent = new Map(marks.map((entry) => [entry.studentId.toString(), entry]));

  return {
    exam: {
      id: exam._id.toString(),
      title: exam.title,
      maxMarks: exam.maxMarks,
    },
    students: students.map((student) => {
      const existing = marksByStudent.get(student._id.toString());
      return {
        id: student._id.toString(),
        name: student.name,
        rollNumber: student.studentMeta?.rollNumber ?? "",
        marksObtained: existing?.marksObtained ?? null,
        remarks: existing?.remarks ?? "",
      };
    }),
  };
}
