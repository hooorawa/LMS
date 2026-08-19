import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import type { Role } from "@/models/User";

export { getSession };
export type { SessionPayload };

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export function requireRole(session: SessionPayload, allowedRoles: Role[]): void {
  if (!allowedRoles.includes(session.role)) {
    redirect("/dashboard");
  }
}

/**
 * Forces `instituteId` into a query filter for every role except super-admin.
 * Any client-supplied `instituteId` on `filter` is overwritten, never trusted.
 */
export function withTenantScope<T extends Record<string, unknown>>(
  filter: T,
  session: SessionPayload
): T & { instituteId?: string | null } {
  if (session.role === "super-admin") {
    return filter;
  }
  return { ...filter, instituteId: session.instituteId };
}

/**
 * Guards fetch-then-mutate flows: throws if a loaded document belongs to a
 * different institute than the caller's session (super-admin is exempt).
 */
export function assertSameInstitute(
  doc: { instituteId?: unknown } | null | undefined,
  session: SessionPayload
): void {
  if (session.role === "super-admin") return;

  const docInstituteId = doc?.instituteId ? String(doc.instituteId) : null;
  if (docInstituteId !== session.instituteId) {
    throw new Error("Resource not found");
  }
}
