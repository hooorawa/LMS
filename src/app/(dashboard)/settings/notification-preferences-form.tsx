"use client";
import { useActionState, useEffect } from "react";
import { updateNotificationPreferences, type UpdateProfileState } from "@/lib/actions/profile.actions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
const initial: UpdateProfileState = {};
const options = [
  { key: "announcements", title: "Announcements", description: "Institute, class, and course announcements." },
  { key: "academic", title: "Academic activity", description: "Exam, class, and deadline updates." },
  { key: "billing", title: "Billing", description: "Fee, invoice, and payment updates." },
] as const;
export function NotificationPreferencesForm({ preferences }: { preferences: Record<(typeof options)[number]["key"], boolean> }) {
  const [state, action, pending] = useActionState(updateNotificationPreferences, initial);
  useEffect(() => { if (state.error) toast.error("Could not save preferences", state.error); if (state.success) toast.success("Notification preferences updated"); }, [state]);
  return <form action={action} className="flex flex-col gap-4">{options.map((option) => <div key={option.key} className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-4"><div><p className="text-sm font-semibold">{option.title}</p><p className="mt-0.5 text-sm text-muted-foreground">{option.description}</p></div><Switch name={option.key} defaultChecked={preferences[option.key]} /></div>)}<Button type="submit" disabled={pending} className="self-start">{pending ? "Saving..." : "Save preferences"}</Button></form>;
}
