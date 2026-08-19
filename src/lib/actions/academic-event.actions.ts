"use server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import AcademicEventModel from "@/models/AcademicEvent";
import UserModel from "@/models/User";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import { createAcademicEventSchema } from "@/lib/validation/academic-event.schema";
import { recordAuditEntry } from "@/lib/audit/log";
export type AcademicEventState = { error?: string; success?: boolean };
export async function createAcademicEvent(_previous: AcademicEventState, formData: FormData): Promise<AcademicEventState> {
  const session = await requireSession(); requireRole(session, ["institute-admin"]);
  const parsed = createAcademicEventSchema.safeParse({ title: formData.get("title"), type: formData.get("type"), startsAt: formData.get("startsAt"), endsAt: formData.get("endsAt"), description: formData.get("description") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid event." };
  const startsAt = new Date(parsed.data.startsAt); const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime())) || (endsAt && endsAt < startsAt)) return { error: "Enter a valid event time range." };
  await connectToDatabase();
  const event = await AcademicEventModel.create({ instituteId: session.instituteId, title: parsed.data.title, type: parsed.data.type, startsAt, endsAt, description: parsed.data.description || undefined, createdBy: session.userId });
  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({ session, actorName: actor?.name ?? "Unknown", action: "calendar.event_create", targetType: "AcademicEvent", targetId: String(event._id), targetName: event.title, summary: `Added calendar event "${event.title}"` });
  revalidatePath("/calendar"); return { success: true };
}
export async function deleteAcademicEvent(formData: FormData): Promise<void> { const session = await requireSession(); requireRole(session, ["institute-admin"]); const id = formData.get("id"); if (typeof id !== "string") return; await connectToDatabase(); await AcademicEventModel.deleteOne(withTenantScope({ _id: id }, session)); revalidatePath("/calendar"); }
