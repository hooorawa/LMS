"use client";

import { ShieldAlert } from "lucide-react";
import { exitImpersonation } from "@/lib/actions/impersonation.actions";

export function ImpersonationBanner({ email }: { email?: string }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"><div className="flex items-center gap-2"><ShieldAlert className="size-4 text-amber-700" /><span>You are impersonating an institute administrator{email ? ` on behalf of ${email}` : ""}.</span></div><form action={exitImpersonation}><button type="submit" className="font-semibold underline underline-offset-2">Exit impersonation</button></form></div>;
}
