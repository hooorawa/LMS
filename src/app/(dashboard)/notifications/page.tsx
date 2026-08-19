import Link from "next/link";
import { listAllNotificationsForUser } from "@/lib/data/notification.data";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notification.actions";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { NotificationTypeBadge } from "@/components/dashboard-shell/notification-type-badge";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);

  const { notifications, total } = await listAllNotificationsForUser(page, PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <form action={markAllNotificationsRead}>
          <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Mark all read
          </button>
        </form>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2">
          {notifications.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start justify-between gap-4 rounded-lg border border-border px-3 py-2.5",
                  !notification.isRead && "bg-primary/5"
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <NotificationTypeBadge type={notification.type} />
                    {!notification.isRead ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-foreground">{notification.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.isRead ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={notification.id} />
                    <button
                      type="submit"
                      className="shrink-0 text-xs font-medium text-primary hover:underline"
                    >
                      Mark read
                    </button>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between">
          <Link
            href={`/notifications?page=${page - 1}`}
            aria-disabled={page <= 1}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              page <= 1 && "pointer-events-none opacity-50"
            )}
          >
            Previous
          </Link>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Link
            href={`/notifications?page=${page + 1}`}
            aria-disabled={page >= pageCount}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              page >= pageCount && "pointer-events-none opacity-50"
            )}
          >
            Next
          </Link>
        </div>
      ) : null}
    </div>
  );
}
