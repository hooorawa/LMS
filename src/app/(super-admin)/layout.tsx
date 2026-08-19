import { requireSession, requireRole } from "@/lib/tenant/scope";
import { DashboardShell } from "@/components/dashboard-shell/shell";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  return (
    <DashboardShell navKey="super-admin" userId={session.userId} role={session.role} impersonatedByEmail={session.impersonatedByEmail}>
      {children}
    </DashboardShell>
  );
}
