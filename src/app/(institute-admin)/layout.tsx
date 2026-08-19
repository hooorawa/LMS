import { requireSession, requireRole } from "@/lib/tenant/scope";
import { DashboardShell } from "@/components/dashboard-shell/shell";

export default async function InstituteAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  return (
    <DashboardShell navKey="institute-admin" userId={session.userId} role={session.role} impersonatedByEmail={session.impersonatedByEmail}>
      {children}
    </DashboardShell>
  );
}
