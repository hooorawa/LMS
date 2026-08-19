import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseGradeSummaryForTeacher } from "@/lib/data/grade.data";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

const COLUMNS = [
  { key: "student", header: "Student" },
  { key: "gradedItems", header: "Graded items" },
  { key: "score", header: "Score" },
  { key: "percent", header: "Percent" },
];

export default async function CourseGradesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCourseGradeSummaryForTeacher(id);

  if (!data) {
    notFound();
  }

  const { course, rows: gradeRows } = data;

  const rows: DataTableRow[] = gradeRows.map((row) => ({
    key: row.studentId,
    searchValue: `${row.name} ${row.email}`,
    cells: [
      <>
        <div className="font-medium">{row.name}</div>
        <div className="text-xs text-muted-foreground">{row.email}</div>
      </>,
      row.itemCount,
      row.itemCount > 0 ? `${row.totalScore} / ${row.totalMaxScore}` : "-",
      row.percent !== null ? `${row.percent.toFixed(1)}%` : "-",
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/grades" className="text-sm text-muted-foreground hover:underline">
          &larr; Grades
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{course.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Grade summary by student</p>
      </div>

      <DataTableCard
        columns={COLUMNS}
        rows={rows}
        searchPlaceholder="Search students..."
        emptyTitle="No enrolled students yet."
      />
    </div>
  );
}
