import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentById } from "@/lib/data/user.data";
import { listClasses } from "@/lib/data/class.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StudentRecordForm } from "./student-record-form";

function formatDate(value?: Date | null) {
  return value ? new Date(value).toLocaleDateString() : "Not recorded";
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [student, classes] = await Promise.all([getStudentById(id), listClasses()]);

  if (!student) notFound();

  const classOptions = classes.map((klass) => ({
    id: String(klass._id),
    label: `${klass.name}${klass.section ? ` ${klass.section}` : ""}`,
  }));
  const assignedClass = student.studentMeta?.classId as unknown as
    | { name?: string; section?: string; academicYear?: string }
    | null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{student.name}</h1>
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={student.status === "active" ? "success" : "secondary"} className="capitalize">
            {student.status}
          </Badge>
          <Link href="/students" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Back to students
          </Link>
          <Link
            href={`/fees/students/${student._id}/payments`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Fees ledger
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Academic identity</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Roll number:</span> {student.studentMeta?.rollNumber || "Not assigned"}</p>
            <p><span className="text-muted-foreground">Class:</span> {assignedClass ? `${assignedClass.name}${assignedClass.section ? ` ${assignedClass.section}` : ""}` : "Unassigned"}</p>
            <p><span className="text-muted-foreground">Academic year:</span> {assignedClass?.academicYear ?? "Not assigned"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Personal profile</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Birthday:</span> {formatDate(student.studentMeta?.birthday)}</p>
            <p><span className="text-muted-foreground">Gender:</span> {student.studentMeta?.gender ? `${student.studentMeta.gender[0].toUpperCase()}${student.studentMeta.gender.slice(1)}` : "Not recorded"}</p>
            <p><span className="text-muted-foreground">Phone:</span> {student.phone || "Not recorded"}</p>
            <p><span className="text-muted-foreground">Special needs:</span> {student.studentMeta?.hasSpecialNeeds ? "Yes" : "No"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Registration</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Registered:</span> {formatDate(student.studentMeta?.registrationDate)}</p>
            <p><span className="text-muted-foreground">Payment type:</span> {student.studentMeta?.paymentType || "Not recorded"}</p>
            <p><span className="text-muted-foreground">Created:</span> {formatDate(student.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student record</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentRecordForm
            studentId={String(student._id)}
            classes={classOptions}
            defaults={{
              name: student.name,
              email: student.email,
              phone: student.phone ?? "",
              rollNumber: student.studentMeta?.rollNumber ?? "",
              classId: student.studentMeta?.classId ? String((student.studentMeta.classId as { _id?: unknown })._id ?? student.studentMeta.classId) : "",
              birthday: student.studentMeta?.birthday ? new Date(student.studentMeta.birthday).toISOString().slice(0, 10) : "",
              gender: student.studentMeta?.gender ?? "",
              guardianName: student.studentMeta?.guardianName ?? "",
              guardianPhone: student.studentMeta?.guardianPhone ?? "",
              guardianEmail: student.studentMeta?.guardianEmail ?? "",
              guardianRelation: student.studentMeta?.guardianRelation ?? "",
              hasSpecialNeeds: Boolean(student.studentMeta?.hasSpecialNeeds),
              specialNeedsDetails: student.studentMeta?.specialNeedsDetails ?? "",
              registrationDate: student.studentMeta?.registrationDate ? new Date(student.studentMeta.registrationDate).toISOString().slice(0, 10) : "",
              paymentType: student.studentMeta?.paymentType ?? "",
              notes: student.studentMeta?.notes ?? "",
              status: student.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
