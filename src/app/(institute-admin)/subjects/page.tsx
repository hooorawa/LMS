import { listSubjects } from "@/lib/data/subject.data";
import { listStaff } from "@/lib/data/user.data";
import { listClasses } from "@/lib/data/class.data";
import { bulkDeleteSubjects, deleteSubject } from "@/lib/actions/subject.actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { SubjectFormDialog } from "./new/subject-form-dialog";
import { SubjectEditDialog } from "./[id]/edit/subject-edit-dialog";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

const COLUMNS = [
  { key: "name", header: "Name", sortable: true },
  { key: "code", header: "Code", sortable: true },
  { key: "teacher", header: "Teacher" },
  { key: "classes", header: "Classes" },
  { key: "actions", header: "Actions" },
];

export default async function SubjectsPage() {
  const [subjects, teachersList, classesList] = await Promise.all([
    listSubjects(),
    listStaff(),
    listClasses(),
  ]);
  const teachers = teachersList.map((teacher) => ({ id: String(teacher._id), name: teacher.name }));
  const classOptions = classesList.map((klass) => ({
    id: String(klass._id),
    label: `${klass.name}${klass.section ? ` ${klass.section}` : ""}`,
  }));
  const subjectsWithoutTeacher = subjects.filter((subject) => !subject.teacherId).length;
  const subjectsWithoutClasses = subjects.filter((subject) => !subject.classIds?.length).length;

  const rows: DataTableRow[] = subjects.map((subject) => {
    const teacher = subject.teacherId as unknown as { name?: string } | null;
    const classes = subject.classIds as unknown as
      | { _id: string; name: string; section?: string }[]
      | undefined;
    const classesLabel =
      classes && classes.length > 0
        ? classes.map((klass) => `${klass.name}${klass.section ? ` ${klass.section}` : ""}`).join(", ")
        : "-";

    return {
      key: String(subject._id),
      bulkValue: String(subject._id),
      searchValue: `${subject.name} ${subject.code} ${teacher?.name ?? ""}`,
      sortValues: [subject.name, subject.code, null, null, null],
      filterValues: {
        teacherAssigned: teacher?.name ? "assigned" : "unassigned",
        classAssigned: classes && classes.length > 0 ? "assigned" : "unassigned",
      },
      cells: [
        <span key="name" className="font-medium">{subject.name}</span>,
        subject.code,
        teacher?.name || "-",
        classesLabel,
        <div key="actions" className="flex items-center gap-2">
          <SubjectEditDialog
            subjectId={String(subject._id)}
            name={subject.name}
            code={subject.code}
            teacherId={subject.teacherId ? String(subject.teacherId) : ""}
            classIds={(subject.classIds ?? []).map((classId: { toString(): string }) => String(classId))}
            teachers={teachers}
            classes={classOptions}
          />
          <ConfirmDeleteButton
            action={deleteSubject}
            hiddenFields={{ id: String(subject._id) }}
            itemLabel={subject.name}
          />
        </div>,
      ],
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader title="Subject map" description="Connect subjects to the right teachers and classes before courses, exams, and attendance rely on them." actions={<SubjectFormDialog teachers={teachers} classes={classOptions} />} metrics={[{ label: "Subjects", value: subjects.length, detail: "Academic subject records", tone: "primary" }, { label: "Need a teacher", value: subjectsWithoutTeacher, detail: "Unassigned subject owners", tone: "warning" }, { label: "Need a class link", value: subjectsWithoutClasses, detail: "Not yet scheduled for a class", tone: "info" }]} />
      <div>
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search subjects..."
          emptyTitle="No subjects yet."
          filters={[
            {
              key: "teacherAssigned",
              label: "Teacher",
              options: [
                { value: "assigned", label: "Assigned" },
                { value: "unassigned", label: "Unassigned" },
              ],
            },
            {
              key: "classAssigned",
              label: "Class link",
              options: [
                { value: "assigned", label: "Assigned" },
                { value: "unassigned", label: "Unassigned" },
              ],
            },
          ]}
          bulkActions={[
            {
              label: "Delete selected",
              action: bulkDeleteSubjects,
              buttonVariant: "destructive",
            },
          ]}
        />
      </div>
    </div>
  );
}
