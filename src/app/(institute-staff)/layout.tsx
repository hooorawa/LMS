import { requireSession, requireRole } from "@/lib/tenant/scope";
import { DashboardShell } from "@/components/dashboard-shell/shell";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  return (
    <DashboardShell navKey="institute-staff" userId={session.userId} role={session.role} impersonatedByEmail={session.impersonatedByEmail}>
      {children}
    </DashboardShell>
  );
}
