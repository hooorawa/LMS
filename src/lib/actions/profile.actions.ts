"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import { requireSession } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { notificationPreferencesSchema, updateProfileSchema } from "@/lib/validation/profile.schema";

export type UpdateProfileState = {
  error?: string;
  success?: boolean;
};

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const session = await requireSession();

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, phone, avatarUrl } = parsed.data;

  await connectToDatabase();

  const user = await UserModel.findById(session.userId);
  if (!user) {
    return { error: "User not found." };
  }

  const before = { name: user.name, phone: user.phone, avatarUrl: user.avatarUrl };

  user.name = name;
  user.phone = phone || undefined;
  user.avatarUrl = avatarUrl || undefined;
  await user.save();

  await recordAuditEntry({
    session,
    actorName: user.name,
    action: "profile.update",
    targetType: "User",
    targetId: user._id.toString(),
    targetName: user.name,
    summary: `Updated own profile`,
    before,
    after: { name: user.name, phone: user.phone, avatarUrl: user.avatarUrl },
  });

  revalidatePath("/settings");

  return { success: true };
}

export async function updateNotificationPreferences(
  _previous: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const session = await requireSession();
  const parsed = notificationPreferencesSchema.safeParse({
    announcements: formData.get("announcements") === "on",
    billing: formData.get("billing") === "on",
    academic: formData.get("academic") === "on",
  });
  if (!parsed.success) return { error: "Invalid notification preferences." };
  await connectToDatabase();
  const user = await UserModel.findById(session.userId);
  if (!user) return { error: "User not found." };
  const before = user.notificationPreferences?.toObject?.() ?? user.notificationPreferences;
  user.notificationPreferences = parsed.data;
  await user.save();
  await recordAuditEntry({ session, actorName: user.name, action: "profile.notification_preferences", targetType: "User", targetId: String(user._id), targetName: user.name, summary: "Updated notification preferences", before, after: parsed.data });
  revalidatePath("/settings");
  return { success: true };
}
