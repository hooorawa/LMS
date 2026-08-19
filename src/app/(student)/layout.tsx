import { requireSession, requireRole } from "@/lib/tenant/scope";
import { DashboardShell } from "@/components/dashboard-shell/shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  return (
    <DashboardShell navKey="student" userId={session.userId} role={session.role} impersonatedByEmail={session.impersonatedByEmail}>
      {children}
    </DashboardShell>
  );
}
