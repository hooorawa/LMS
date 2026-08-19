"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import NotificationModel from "@/models/Notification";
import { requireSession } from "@/lib/tenant/scope";

export async function markNotificationRead(formData: FormData): Promise<void> {
  const session = await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const notification = await NotificationModel.findById(id);
  if (!notification || notification.userId.toString() !== session.userId) return;

  notification.isRead = true;
  await notification.save();

  revalidatePath("/dashboard");
}

export async function markAllNotificationsRead(): Promise<void> {
  const session = await requireSession();

  await connectToDatabase();

  await NotificationModel.updateMany(
    { userId: session.userId, isRead: false },
    { $set: { isRead: true } }
  );

  revalidatePath("/dashboard");
}
