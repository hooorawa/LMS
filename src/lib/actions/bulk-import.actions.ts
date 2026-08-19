"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { recordAuditEntry } from "@/lib/audit/log";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import CourseModel from "@/models/Course";
import EnrollmentModel from "@/models/Enrollment";
import UserModel from "@/models/User";

function parseCsv(input: string) {
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

export async function bulkImportRecords(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const type = String(formData.get("type") ?? "");
  const csv = String(formData.get("csv") ?? "");
  const rows = parseCsv(csv);
  if (!rows.length) return;

  await connectToDatabase();

  let created = 0;
  let skipped = 0;

  if (type === "students" || type === "staff") {
    for (const row of rows) {
      const name = String(row.name ?? "").trim();
      const email = String(row.email ?? "").trim().toLowerCase();
      if (!name || !email) {
        skipped += 1;
        continue;
      }
      const existing = await UserModel.findOne({ email }).select("_id");
      if (existing) {
        skipped += 1;
        continue;
      }
      const passwordHash = await hashPassword(generateTempPassword());
      await UserModel.create({
        instituteId: session.instituteId,
        role: type === "students" ? "student" : "institute-staff",
        name,
        email,
        passwordHash,
        mustChangePassword: true,
        status: "active",
        phone: row.phone || undefined,
        studentMeta:
          type === "students"
            ? {
                rollNumber: row.rollNumber || undefined,
                classId: row.classId || undefined,
                birthday: row.birthday ? new Date(row.birthday) : undefined,
                gender: row.gender || undefined,
                guardianName: row.guardianName || undefined,
                guardianPhone: row.guardianPhone || undefined,
                guardianEmail: row.guardianEmail || undefined,
                guardianRelation: row.guardianRelation || undefined,
                hasSpecialNeeds: String(row.hasSpecialNeeds || "").toLowerCase() === "true",
                specialNeedsDetails: row.specialNeedsDetails || undefined,
                registrationDate: row.registrationDate ? new Date(row.registrationDate) : undefined,
                paymentType: row.paymentType || undefined,
                notes: row.notes || undefined,
              }
            : undefined,
        staffMeta:
          type === "staff"
            ? {
                employeeCode: row.employeeCode || undefined,
                basicSalary: Number(row.basicSalary || 0),
              }
            : undefined,
        createdBy: session.userId,
      });
      created += 1;
    }
  }

  if (type === "enrollments") {
    for (const row of rows) {
      const email = String(row.studentEmail ?? "").trim().toLowerCase();
      const courseTitle = String(row.courseTitle ?? "").trim();
      if (!email || !courseTitle) {
        skipped += 1;
        continue;
      }
      const [student, course] = await Promise.all([
        UserModel.findOne(withTenantScope({ role: "student", email }, session)).select("_id"),
        CourseModel.findOne(withTenantScope({ title: courseTitle }, session)).select("_id"),
      ]);
      if (!student || !course) {
        skipped += 1;
        continue;
      }
      const result = await EnrollmentModel.updateOne(
        { courseId: course._id, studentId: student._id },
        {
          $setOnInsert: {
            instituteId: session.instituteId,
            courseId: course._id,
            studentId: student._id,
            status: "active",
            createdBy: session.userId,
          },
        },
        { upsert: true }
      );
      if (result.upsertedCount) created += 1;
      else skipped += 1;
    }
  }

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "bulk_import.run",
    targetType: "BulkImport",
    targetName: type,
    summary: `Imported ${created} ${type} record(s), skipped ${skipped}`,
    metadata: { type, created, skipped },
  });

  revalidatePath("/imports");
  revalidatePath("/students");
  revalidatePath("/staff");
  revalidatePath("/enrollments");
}
