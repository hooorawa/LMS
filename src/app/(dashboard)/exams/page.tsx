import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaffModuleAccess } from "@/lib/auth/staff-permissions";
import { getSession } from "@/lib/auth/session";
import { listExamsForInstitute, listExamsForTeacher } from "@/lib/data/exam.data";
import { listSubjects } from "@/lib/data/subject.data";
import { listClasses } from "@/lib/data/class.data";
import { deleteExam } from "@/lib/actions/exam.actions";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { ExamFormDialog } from "./new/exam-form-dialog";
import { ExamEditDialog } from "./[id]/edit/exam-edit-dialog";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

const ADMIN_COLUMNS = [
  { key: "title", header: "Title" },
  { key: "subject", header: "Subject" },
  { key: "class", header: "Class" },
  { key: "date", header: "Date" },
  { key: "maxMarks", header: "Max marks" },
  { key: "actions", header: "Actions" },
];

const TEACHER_COLUMNS = [
  { key: "title", header: "Title" },
  { key: "subject", header: "Subject" },
  { key: "class", header: "Class" },
  { key: "date", header: "Date" },
  { key: "actions", header: "Actions" },
];

function classLabel(exam: { classId: unknown }) {
  const klass = exam.classId as unknown as { name?: string; section?: string } | null;
  return klass ? `${klass.name}${klass.section ? ` - ${klass.section}` : ""}` : "-";
}

export default async function ExamsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "institute-admin") {
    const [exams, subjectsList, classesList] = await Promise.all([
      listExamsForInstitute(),
      listSubjects(),
      listClasses(),
    ]);
    const subjects = subjectsList.map((subject) => ({ id: String(subject._id), name: subject.name }));
    const classes = classesList.map((klass) => ({
      id: String(klass._id),
      name: klass.name,
      section: klass.section,
    }));
    const upcomingExams = exams.filter((exam) => new Date(exam.examDate) >= new Date()).length;
    const scheduledClasses = new Set(exams.map((exam) => String(exam.classId))).size;

    const rows: DataTableRow[] = exams.map((exam) => {
      const subject = (exam.subjectId as unknown as { name?: string } | null)?.name;
      return {
        key: String(exam._id),
        searchValue: `${exam.title} ${subject ?? ""}`,
        cells: [
          <span key="title" className="font-medium">{exam.title}</span>,
          subject ?? "-",
          classLabel(exam),
          new Date(exam.examDate).toLocaleDateString(),
          exam.maxMarks,
          <div key="actions" className="flex items-center gap-2">
            <ExamEditDialog
              examId={String(exam._id)}
              title={exam.title}
              subjectId={String(exam.subjectId)}
              classId={String(exam.classId)}
              examDate={new Date(exam.examDate).toISOString().slice(0, 10)}
              maxMarks={exam.maxMarks}
              term={exam.term ?? ""}
              academicYear={exam.academicYear}
              subjects={subjects}
              classes={classes}
            />
            <ConfirmDeleteButton
              action={deleteExam}
              hiddenFields={{ id: String(exam._id) }}
              itemLabel={exam.title}
            />
          </div>,
        ],
      };
    });

    return (
      <div className="flex flex-col gap-6">
          <WorkspaceHeader eyebrow="Academic assessment" title="Exam schedule" description="Build a reliable assessment calendar, then keep every class and subject ready for marks entry." actions={<ExamFormDialog subjects={subjects} classes={classes} />} metrics={[{ label: "Scheduled exams", value: exams.length, detail: "All assessment records", tone: "primary" }, { label: "Upcoming exams", value: upcomingExams, detail: "Still ahead on the calendar", tone: "success" }, { label: "Classes covered", value: scheduledClasses, detail: "With a scheduled assessment", tone: "info" }]} />
          <DataTableCard
            title="Exam calendar"
            sub="Search by exam or subject and keep dates, marks, and ownership accurate."
            columns={ADMIN_COLUMNS}
            rows={rows}
            searchPlaceholder="Search exams..."
            emptyTitle="No exams scheduled yet."
          />
      </div>
    );
  }

  if (session.role === "institute-staff") {
    await requireStaffModuleAccess("subjects");
    const exams = await listExamsForTeacher();
    const upcomingExams = exams.filter((exam) => new Date(exam.examDate) >= new Date()).length;

    const rows: DataTableRow[] = exams.map((exam) => {
      const subject = (exam.subjectId as unknown as { name?: string } | null)?.name;
      return {
        key: String(exam._id),
        searchValue: `${exam.title} ${subject ?? ""}`,
        cells: [
          <span key="title" className="font-medium">{exam.title}</span>,
          subject ?? "-",
          classLabel(exam),
          new Date(exam.examDate).toLocaleDateString(),
          <Link
            key="marks"
            href={`/exams/${exam._id}/marks`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Enter marks
          </Link>,
        ],
      };
    });

    return (
      <div className="flex flex-col gap-6">
        <WorkspaceHeader
          eyebrow="Academic assessment"
          title="Exams"
          description="Enter marks for exams scheduled across the subjects you teach."
          metrics={[
            { label: "Exams", value: exams.length, detail: "For your subjects", tone: "primary" },
            { label: "Upcoming", value: upcomingExams, detail: "Still ahead on the calendar", tone: "success" },
          ]}
        />
        <DataTableCard
          title="Your exams"
          sub="Search by exam or subject and enter marks once results are ready."
          columns={TEACHER_COLUMNS}
          rows={rows}
          searchPlaceholder="Search exams..."
          emptyTitle="No exams for your subjects yet."
        />
      </div>
    );
  }

  redirect("/dashboard");
}
