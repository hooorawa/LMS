import { getExamRegistrationDataForStudent } from "@/lib/data/exam-registration.data";
import { ExamRegistrationList } from "./exam-registration-list";

export default async function ExamRegistrationPage() {
  const { exams, registrations, currentTime } = await getExamRegistrationDataForStudent();
  const now = currentTime.getTime();
  const registeredExamIds = new Set(registrations.filter((registration) => registration.status === "registered").map((registration) => String(registration.examId?._id ?? registration.examId)));
  return <ExamRegistrationList exams={exams.map((exam) => ({ id: String(exam._id), title: exam.title, date: exam.examDate.toISOString(), term: exam.term ?? "", academicYear: exam.academicYear, subject: (exam.subjectId as unknown as { name?: string } | null)?.name ?? "Subject", subjectCode: (exam.subjectId as unknown as { code?: string } | null)?.code ?? "", registered: registeredExamIds.has(String(exam._id)), upcoming: exam.examDate.getTime() >= now }))} registrations={registrations.map((registration) => { const exam = registration.examId as unknown as { title?: string; examDate?: Date; subjectId?: { name?: string } } | null; return { id: String(registration._id), status: registration.status, registeredAt: registration.registeredAt.toISOString(), examTitle: exam?.title ?? "Deleted exam", examDate: exam?.examDate?.toISOString() ?? null, subject: exam?.subjectId?.name ?? "Subject", cancellable: registration.status === "registered" && Boolean(exam?.examDate && exam.examDate.getTime() > now) }; })} />;
}
