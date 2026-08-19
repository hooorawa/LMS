import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import type { NotificationType } from "@/models/Notification";

const TYPE_VARIANT: Record<NotificationType, VariantProps<typeof badgeVariants>["variant"]> = {
  announcement: "secondary",
  academic: "default",
  billing: "warning",
  trial: "default",
};

const TYPE_LABEL: Record<NotificationType, string> = {
  announcement: "Announcement",
  academic: "Academic",
  billing: "Billing",
  trial: "Trial",
};

export function NotificationTypeBadge({ type }: { type: NotificationType }) {
  return <Badge variant={TYPE_VARIANT[type]}>{TYPE_LABEL[type]}</Badge>;
}
