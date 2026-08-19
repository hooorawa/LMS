import { Suspense } from "react";
import { LayoutGrid, Menu } from "lucide-react";
import { logout } from "@/lib/actions/auth.actions";
import { SidebarNav } from "./sidebar-nav";
import { NavSearch } from "./nav-search";
import { NotificationBellServer } from "./notification-bell-server";
import { ProfileHeaderServer } from "./profile-header-server";
import { NAV_ACCENT, type NavKey } from "./nav-config";
import { ImpersonationBanner } from "./impersonation-banner";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";

export { formatRole } from "./profile-header";

function NotificationBellSkeleton() {
  return <div className="shadow-hairline size-8.5 animate-pulse rounded-lg bg-card" />;
}

function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-8.5 shrink-0 animate-pulse rounded-full bg-card" />
      <div className="hidden sm:flex sm:flex-col sm:gap-1">
        <div className="h-3 w-20 animate-pulse rounded bg-card" />
        <div className="h-2.5 w-14 animate-pulse rounded bg-card" />
      </div>
    </div>
  );
}

export async function DashboardShell({
  navKey,
  userId,
  role,
  brandName = "RaxwoLMS",
  impersonatedByEmail,
  children,
}: {
  navKey: NavKey;
  userId: string;
  role: string;
  brandName?: string;
  impersonatedByEmail?: string;
  children: React.ReactNode;
}) {
  let staffPermissions: Record<string, boolean> | undefined;
  if (navKey === "institute-staff") {
    try {
      await connectToDatabase();
      const user = await UserModel.findById(userId).select("staffMeta.permissions").lean();
      staffPermissions = user?.staffMeta?.permissions;
    } catch {
      // A DB hiccup here shouldn't take down the whole layout (which no
      // error.tsx can catch) — degrade to no gated nav items instead.
      staffPermissions = undefined;
    }
  }

  return (
    <div
      className="relative flex h-dvh overflow-hidden"
      style={{ "--sidebar-primary": NAV_ACCENT[navKey] } as React.CSSProperties}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_22%)]" />
      <input type="checkbox" id="mobile-nav-toggle" className="peer hidden" />

      <nav
        id="dashboard-sidebar"
        className="sidebar-gradient shadow-sidebar no-scrollbar fixed inset-y-0 left-0 z-50 m-3 flex w-[17rem] shrink-0 -translate-x-[calc(100%+1rem)] flex-col gap-1 overflow-y-auto overscroll-contain rounded-[28px] border border-sidebar-border/80 p-4 transition-transform duration-200 peer-checked:translate-x-0 lg:static lg:inset-y-auto lg:left-auto lg:h-auto lg:translate-x-0 lg:self-stretch"
      >
        <div className="flex items-center gap-3 px-2 pb-5 pt-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[1.1rem] bg-sidebar-primary shadow-button">
            <LayoutGrid className="size-[17px] text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-[16.5px] font-bold tracking-tight text-sidebar-foreground">{brandName}</span>
            <span className="text-[11px] font-semibold tracking-[0.1em] text-sidebar-foreground/45 uppercase">
              Learning workspace
            </span>
          </div>
        </div>

        <SidebarNav navKey={navKey} staffPermissions={staffPermissions} />

        <div className="flex-1" />

        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-[13.5px] font-medium text-sidebar-foreground/55 transition-colors hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground/90"
          >
            Log out
          </button>
        </form>
      </nav>

      <label
        htmlFor="mobile-nav-toggle"
        aria-hidden="true"
        className="fixed inset-0 z-40 hidden bg-foreground/40 backdrop-blur-sm peer-checked:block lg:!hidden"
      />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain lg:pl-3">
        <div className="sticky top-0 z-30 px-3 pt-3 sm:px-4 lg:px-0">
          <div className="surface-subtle shadow-hairline flex h-16 items-center justify-between rounded-[24px] border border-border/70 px-4 backdrop-blur-xl sm:px-6 lg:justify-end">
          <label
            htmlFor="mobile-nav-toggle"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted lg:hidden"
          >
            <Menu className="size-[18px]" />
          </label>

          <div className="flex items-center gap-3 sm:gap-4.5">
            <NavSearch navKey={navKey} />
            <Suspense fallback={<NotificationBellSkeleton />}>
              <NotificationBellServer />
            </Suspense>
            <Suspense fallback={<ProfileHeaderSkeleton />}>
              <ProfileHeaderServer userId={userId} role={role} />
            </Suspense>
          </div>
        </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 px-3 pb-4 sm:px-4 sm:pb-6 lg:px-0 lg:pb-8">
          {impersonatedByEmail !== undefined ? <ImpersonationBanner email={impersonatedByEmail} /> : null}
          <main className="mx-auto flex w-full max-w-[1520px] flex-col gap-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
