"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { NAV_BY_ROLE, type NavKey } from "./nav-config";

const SCROLL_STORAGE_KEY = "dashboard-sidebar-scroll";

function closeMobileNav() {
  const toggle = document.getElementById("mobile-nav-toggle") as HTMLInputElement | null;
  if (toggle) toggle.checked = false;
}

export function SidebarNav({
  navKey,
  staffPermissions,
}: {
  navKey: NavKey;
  staffPermissions?: Record<string, boolean>;
}) {
  const pathname = usePathname();
  const restoredRef = useRef(false);

  useEffect(() => {
    closeMobileNav();
  }, [pathname]);

  // Restore the sidebar's own scroll position after navigation/remount, so
  // clicking a link never snaps the list back to the top.
  useLayoutEffect(() => {
    const nav = document.getElementById("dashboard-sidebar");
    if (!nav) return;

    if (!restoredRef.current) {
      restoredRef.current = true;
      const saved = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      if (saved) nav.scrollTop = Number(saved);
    }

    const handleScroll = () => {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, String(nav.scrollTop));
    };
    nav.addEventListener("scroll", handleScroll, { passive: true });
    return () => nav.removeEventListener("scroll", handleScroll);
  }, []);

  const items = NAV_BY_ROLE[navKey].filter((item) => {
    if (navKey !== "institute-staff" || !item.staffPermission) return true;
    return Boolean(staffPermissions?.[item.staffPermission]);
  });

  return (
    <div className="flex flex-1 flex-col gap-1">
      {items.map((item, index) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        const showGroupHeader = item.group !== undefined && item.group !== items[index - 1]?.group;

        const groupHeader = showGroupHeader ? (
          <div
            key={`group-${item.group}`}
            className="px-3 pb-1.5 pt-3.5 text-[11px] font-bold tracking-[0.08em] text-sidebar-foreground/45 uppercase first:pt-1.5"
          >
            {item.group}
          </div>
        ) : null;

        if (item.disabled) {
          return (
            <div key={item.label}>
              {groupHeader}
              <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sidebar-foreground/40">
                <span className="size-1.5 shrink-0 rounded-full bg-transparent" />
                <Icon className="size-[18px] shrink-0" />
                <span className="text-[13.5px] font-medium">{item.label}</span>
                <span className="ml-auto rounded bg-sidebar-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/50">
                  Soon
                </span>
              </div>
            </div>
          );
        }

        return (
          <div key={item.label}>
            {groupHeader}
            <Link
              href={item.href}
              onClick={closeMobileNav}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 transition-all",
                active
                  ? "border-sidebar-primary/15 bg-gradient-to-r from-sidebar-primary/18 via-sidebar-primary/6 to-transparent shadow-hairline"
                  : "hover:border-sidebar-border/70 hover:bg-sidebar-accent/80"
              )}
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full transition-colors",
                  active ? "bg-sidebar-primary" : "bg-transparent"
                )}
              />
              <Icon
                className={cn(
                  "size-[18px] shrink-0",
                  active ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground/80"
                )}
              />
              <span
                className={cn(
                  "text-[13.5px]",
                  active
                    ? "font-semibold text-sidebar-accent-foreground"
                    : "font-medium text-sidebar-foreground/70 group-hover:text-sidebar-foreground/90"
                )}
              >
                {item.label}
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
