import { bulkImportRecords } from "@/lib/actions/bulk-import.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const TEMPLATES = [
  {
    label: "Students",
    value: "students",
    sample:
      "name,email,phone,rollNumber,birthday,gender,guardianName,guardianPhone,guardianEmail,guardianRelation,hasSpecialNeeds,specialNeedsDetails,registrationDate,paymentType,notes\nStudent One,student@example.com,0770000000,S001,2008-05-14,female,Guardian Name,0771111111,guardian@example.com,Mother,false,,2026-08-01,cash,Transferred from paper registration",
  },
  {
    label: "Staff",
    value: "staff",
    sample: "name,email,phone,employeeCode,basicSalary\nTeacher One,teacher@example.com,0770000001,T001,50000",
  },
  {
    label: "Enrollments",
    value: "enrollments",
    sample: "studentEmail,courseTitle\nstudent@example.com,Mathematics Foundation",
  },
];

export default function ImportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-eyebrow text-primary">Institute admin</p>
        <h1 className="text-heading mt-1 text-2xl">Bulk Imports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Import students, staff, and enrollments from CSV using the supported templates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {TEMPLATES.map((template) => (
          <Card key={template.value}>
            <CardHeader>
              <CardTitle>{template.label} template</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                {template.sample}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={bulkImportRecords} className="flex flex-col gap-3">
            <select name="type" className="h-10 rounded-xl border border-input bg-card px-3 text-sm">
              {TEMPLATES.map((template) => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))}
            </select>
            <Textarea name="csv" className="min-h-56 font-mono text-xs" placeholder={TEMPLATES[0].sample} required />
            <Button type="submit" className="self-start">Run import</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
