import { requireSession } from "@/lib/tenant/scope";
import { DashboardShell } from "@/components/dashboard-shell/shell";
import type { NavKey } from "@/components/dashboard-shell/nav-config";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <DashboardShell navKey={session.role as NavKey} userId={session.userId} role={session.role}>
      {children}
    </DashboardShell>
  );
}
