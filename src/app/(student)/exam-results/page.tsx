import { getStudentExamResultsData } from "@/lib/data/remaining-plan.data";
import { Badge } from "@/components/ui/badge";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ExamResultsPage() {
  const results = await getStudentExamResultsData();
  const scoredResults = results.filter((result) => result.percent !== null);
  const averagePercent = scoredResults.length
    ? scoredResults.reduce((total, result) => total + (result.percent ?? 0), 0) / scoredResults.length
    : 0;

  const rows: DataTableRow[] = results.map((result) => ({
    key: result.id,
    searchValue: `${result.title} ${result.subject} ${result.term} ${result.academicYear}`,
    sortValues: [
      result.title,
      result.subject,
      result.examDate.getTime(),
      result.percent ?? 0,
      result.grade,
      null,
    ],
    cells: [
      <span key="title" className="font-medium">
        {result.title}
      </span>,
      result.subjectCode ? `${result.subject} (${result.subjectCode})` : result.subject,
      formatDate(result.examDate),
      `${result.marksObtained} / ${result.maxMarks}`,
      result.percent !== null ? `${result.percent.toFixed(1)}%` : "-",
      result.grade ? <Badge key="grade" variant="success">{result.grade}</Badge> : "-",
      result.remarks || "-",
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <StudentWorkspaceHeader
        eyebrow="Academic record"
        title="Exam results"
        description="Review published marks, grades, and teacher remarks in one reliable academic record."
        metrics={[
          { label: "Results published", value: results.length, detail: "Across all terms", tone: "primary" },
          { label: "Average score", value: `${averagePercent.toFixed(1)}%`, detail: "Published scored exams", tone: "success" },
          { label: "Grades issued", value: results.filter((result) => Boolean(result.grade)).length, detail: "With a final grade", tone: "info" },
        ]}
      />

      <DataTableCard
        columns={[
          { key: "exam", header: "Exam", sortable: true },
          { key: "subject", header: "Subject" },
          { key: "date", header: "Date", sortable: true },
          { key: "marks", header: "Marks" },
          { key: "percent", header: "Percent", sortable: true },
          { key: "grade", header: "Grade", sortable: true },
          { key: "remarks", header: "Remarks" },
        ]}
        rows={rows}
        searchPlaceholder="Search results..."
        emptyTitle="No exam results published yet."
      />
    </div>
  );
}
