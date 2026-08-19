import { listNotificationsForUser, countUnreadForUser } from "@/lib/data/notification.data";
import { NotificationBell } from "./notification-bell";

export async function NotificationBellServer() {
  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForUser(8),
    countUnreadForUser(),
  ]);

  return <NotificationBell notifications={notifications} unreadCount={unreadCount} />;
}
