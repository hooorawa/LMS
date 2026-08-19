import { listClasses } from "@/lib/data/class.data";
import { listStaff } from "@/lib/data/user.data";
import { bulkDeleteClasses, deleteClass } from "@/lib/actions/class.actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { ClassFormDialog } from "./new/class-form-dialog";
import { ClassEditDialog } from "./[id]/edit/class-edit-dialog";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

const COLUMNS = [
  { key: "name", header: "Name", sortable: true },
  { key: "section", header: "Section" },
  { key: "year", header: "Academic year", sortable: true },
  { key: "teacher", header: "Class teacher" },
  { key: "status", header: "Status", sortable: true },
  { key: "actions", header: "Actions" },
];

export default async function ClassesPage() {
  const [classes, teachersList] = await Promise.all([listClasses(), listStaff()]);
  const activeClasses = classes.filter((klass) => klass.status === "active").length;
  const classesWithoutTeacher = classes.filter((klass) => !klass.classTeacherId).length;
  const teachers = teachersList.map((teacher) => ({ id: String(teacher._id), name: teacher.name }));

  const rows: DataTableRow[] = classes.map((klass) => {
    const teacher = (klass.classTeacherId as unknown as { name?: string } | null)?.name;
    return {
      key: String(klass._id),
      bulkValue: String(klass._id),
      searchValue: `${klass.name} ${klass.section ?? ""} ${teacher ?? ""}`,
      sortValues: [klass.name, null, klass.academicYear, null, klass.status, null],
      filterValues: {
        status: klass.status,
        teacherAssigned: teacher ? "assigned" : "unassigned",
      },
      cells: [
        <span key="name" className="font-medium">{klass.name}</span>,
        klass.section || "-",
        klass.academicYear,
        teacher || "-",
        <Badge key="status" variant={klass.status === "active" ? "success" : "secondary"} className="capitalize">
          {klass.status}
        </Badge>,
        <div key="actions" className="flex items-center gap-2">
          <ClassEditDialog
            classId={String(klass._id)}
            name={klass.name}
            section={klass.section ?? ""}
            academicYear={klass.academicYear}
            classTeacherId={klass.classTeacherId ? String(klass.classTeacherId) : ""}
            status={klass.status ?? "active"}
            teachers={teachers}
          />
          <ConfirmDeleteButton
            action={deleteClass}
            hiddenFields={{ id: String(klass._id) }}
            itemLabel={klass.name}
          />
        </div>,
      ],
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader title="Class structure" description="Create class groups, assign ownership, and keep academic-year delivery organized." actions={<ClassFormDialog teachers={teachers} />} metrics={[{ label: "Classes", value: classes.length, detail: "Across all academic years", tone: "primary" }, { label: "Active classes", value: activeClasses, detail: "Open for delivery", tone: "success" }, { label: "Teacher assignment", value: classesWithoutTeacher, detail: "Classes still unowned", tone: "warning" }]} />
      <div>
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search classes..."
          emptyTitle="No classes yet."
          filters={[
            {
              key: "status",
              label: "Status",
              options: [
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ],
            },
            {
              key: "teacherAssigned",
              label: "Teacher",
              options: [
                { value: "assigned", label: "Assigned" },
                { value: "unassigned", label: "Unassigned" },
              ],
            },
          ]}
          bulkActions={[
            {
              label: "Delete selected",
              action: bulkDeleteClasses,
              buttonVariant: "destructive",
            },
          ]}
        />
      </div>
    </div>
  );
}
