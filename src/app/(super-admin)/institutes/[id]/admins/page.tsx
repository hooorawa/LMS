import Link from "next/link";
import { notFound } from "next/navigation";
import { getInstituteById, getInstituteAdmins } from "@/lib/data/institute.data";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { AddAdminForm } from "./add-admin-form";
import { AdminRowActions } from "./admin-row-actions";

const COLUMNS = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "status", header: "Status" },
  { key: "lastLogin", header: "Last login" },
  { key: "actions", header: "Actions" },
];

export default async function InstituteAdminsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const institute = await getInstituteById(id);

  if (!institute) {
    notFound();
  }

  const admins = await getInstituteAdmins(id);

  const rows: DataTableRow[] = admins.map((admin) => ({
    key: admin.id,
    searchValue: `${admin.name} ${admin.email}`,
    cells: [
      admin.name,
      admin.email,
      admin.phone || "-",
      <Badge key="status" variant={admin.status === "active" ? "success" : "secondary"} className="capitalize">
        {admin.status}
      </Badge>,
      admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "Never",
      <AdminRowActions key="actions" userId={admin.id} adminName={admin.name} />,
    ],
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admins</h1>
          <p className="mt-1 text-sm text-muted-foreground">{institute.name}</p>
        </div>
        <Link href={`/institutes/${id}`} className={cn(buttonVariants({ variant: "outline" }))}>
          Back to institute
        </Link>
      </div>
      <div className="mt-6">
        <AddAdminForm instituteId={id} />
      </div>
      <div className="mt-6">
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search admins..."
          emptyTitle="No admins for this institute yet."
        />
      </div>
    </div>
  );
}
