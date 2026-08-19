"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import SystemSettingsModel from "@/models/SystemSettings";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { updateSystemSettingsSchema } from "@/lib/validation/system-settings.schema";

export type UpdateSystemSettingsState = {
  error?: string;
  success?: boolean;
};

export async function updateSystemSettings(
  _prevState: UpdateSystemSettingsState,
  formData: FormData
): Promise<UpdateSystemSettingsState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const parsed = updateSystemSettingsSchema.safeParse({
    systemName: formData.get("systemName"),
    tagline: formData.get("tagline"),
    logoUrl: formData.get("logoUrl"),
    supportEmail: formData.get("supportEmail"),
    defaultTrialDays: formData.get("defaultTrialDays"),
    primaryColor: formData.get("primaryColor"),
    privacyPolicy: formData.get("privacyPolicy"),
    termsOfUse: formData.get("termsOfUse"),
    helpCenterContent: formData.get("helpCenterContent"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const data = parsed.data;

  await connectToDatabase();

  const before = await SystemSettingsModel.findOne().lean();

  const updated = await SystemSettingsModel.findOneAndUpdate(
    {},
    {
      systemName: data.systemName,
      tagline: data.tagline || undefined,
      logoUrl: data.logoUrl || undefined,
      supportEmail: data.supportEmail || undefined,
      defaultTrialDays: data.defaultTrialDays,
      primaryColor: data.primaryColor || undefined,
      privacyPolicy: data.privacyPolicy || undefined,
      termsOfUse: data.termsOfUse || undefined,
      helpCenterContent: data.helpCenterContent || undefined,
      updatedBy: session.userId,
    },
    { upsert: true, new: true }
  ).lean();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    instituteId: null,
    actorName: actor?.name ?? "Unknown",
    action: "system-settings.update",
    targetType: "SystemSettings",
    targetId: updated?._id?.toString(),
    targetName: data.systemName,
    summary: `Updated platform settings`,
    before,
    after: updated,
  });

  revalidatePath("/platform-settings");

  return { success: true };
}
