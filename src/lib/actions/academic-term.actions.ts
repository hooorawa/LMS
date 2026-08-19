"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { recordAuditEntry } from "@/lib/audit/log";
import { requireRole, requireSession } from "@/lib/tenant/scope";
import AcademicTermModel, { ACADEMIC_TERM_STATUSES } from "@/models/AcademicTerm";
import UserModel from "@/models/User";

export async function createAcademicTerm(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const name = String(formData.get("name") ?? "").trim();
  const academicYear = String(formData.get("academicYear") ?? "").trim();
  const status = String(formData.get("status") ?? "planned");
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const endsAt = new Date(String(formData.get("endsAt") ?? ""));

  if (!name || !academicYear || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return;
  }
  if (endsAt < startsAt) return;
  if (!ACADEMIC_TERM_STATUSES.includes(status as (typeof ACADEMIC_TERM_STATUSES)[number])) return;

  await connectToDatabase();

  const overlap = await AcademicTermModel.findOne({
    instituteId: session.instituteId,
    academicYear,
    startsAt: { $lte: endsAt },
    endsAt: { $gte: startsAt },
  }).lean();
  if (overlap) return;

  if (status === "active") {
    await AcademicTermModel.updateMany(
      { instituteId: session.instituteId, status: "active" },
      { $set: { status: "planned" } }
    );
  }

  const term = await AcademicTermModel.create({
    instituteId: session.instituteId,
    name,
    academicYear,
    startsAt,
    endsAt,
    status,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "academic_term.create",
    targetType: "AcademicTerm",
    targetId: String(term._id),
    targetName: term.name,
    summary: `Created academic term "${term.name}"`,
    after: { name, academicYear, startsAt, endsAt, status },
  });

  revalidatePath("/terms");
  revalidatePath("/operations");
  revalidatePath("/calendar");
}

export async function updateAcademicTermStatus(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !ACADEMIC_TERM_STATUSES.includes(status as (typeof ACADEMIC_TERM_STATUSES)[number])) {
    return;
  }

  await connectToDatabase();

  const term = await AcademicTermModel.findOne({ _id: id, instituteId: session.instituteId });
  if (!term) return;

  if (status === "active") {
    await AcademicTermModel.updateMany(
      { instituteId: session.instituteId, _id: { $ne: term._id }, status: "active" },
      { $set: { status: "planned" } }
    );
  }

  const before = term.status;
  term.status = status as (typeof ACADEMIC_TERM_STATUSES)[number];
  await term.save();

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "academic_term.status_update",
    targetType: "AcademicTerm",
    targetId: String(term._id),
    targetName: term.name,
    summary: `Updated term "${term.name}" status to ${term.status}`,
    before: { status: before },
    after: { status: term.status },
  });

  revalidatePath("/terms");
  revalidatePath("/operations");
  revalidatePath("/calendar");
}

export async function deleteAcademicTerm(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await connectToDatabase();

  const term = await AcademicTermModel.findOneAndDelete({ _id: id, instituteId: session.instituteId });
  if (!term) return;

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "academic_term.delete",
    targetType: "AcademicTerm",
    targetId: String(term._id),
    targetName: term.name,
    summary: `Deleted academic term "${term.name}"`,
  });

  revalidatePath("/terms");
  revalidatePath("/operations");
  revalidatePath("/calendar");
}
