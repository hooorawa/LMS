import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import NotificationModel from "@/models/Notification";
import { requireSession } from "@/lib/tenant/scope";

export async function listNotificationsForUser(limit = 10) {
  const session = await requireSession();

  await connectToDatabase();

  const notifications = await NotificationModel.find({ userId: session.userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return notifications.map((notification) => ({
    id: notification._id.toString(),
    title: notification.title,
    body: notification.body,
    link: notification.link ?? null,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  }));
}

export async function countUnreadForUser(): Promise<number> {
  const session = await requireSession();

  await connectToDatabase();

  return NotificationModel.countDocuments({ userId: session.userId, isRead: false });
}

export async function listAllNotificationsForUser(page = 1, pageSize = 20) {
  const session = await requireSession();

  await connectToDatabase();

  const filter = { userId: session.userId };
  const [notifications, total] = await Promise.all([
    NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    NotificationModel.countDocuments(filter),
  ]);

  return {
    notifications: notifications.map((notification) => ({
      id: notification._id.toString(),
      title: notification.title,
      body: notification.body,
      link: notification.link ?? null,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}
