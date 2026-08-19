import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/session";

const SESSION_COOKIE = "lms_session";
const PUBLIC_ROUTES = ["/login"];
const CHANGE_PASSWORD_ROUTE = "/change-password";
const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";
const INSTITUTE_ADMIN_ONLY_PREFIXES = [
  "/teachers",
  "/students",
  "/classes",
  "/subjects",
  "/enrollments",
];
const SUPER_ADMIN_ONLY_PREFIXES = ["/institutes"];
const STUDENT_ONLY_PREFIXES = ["/my-courses"];

function matchesAnyPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? verifySession(token) : null;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (!session) {
    if (isPublicRoute) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_ROUTE, request.url));
  }

  const isChangePasswordRoute = pathname === CHANGE_PASSWORD_ROUTE;

  if (session.mustChangePassword && !isChangePasswordRoute) {
    return NextResponse.redirect(new URL(CHANGE_PASSWORD_ROUTE, request.url));
  }

  if (!session.mustChangePassword && isChangePasswordRoute) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_ROUTE, request.url));
  }

  if (
    session.role !== "institute-admin" &&
    matchesAnyPrefix(pathname, INSTITUTE_ADMIN_ONLY_PREFIXES)
  ) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_ROUTE, request.url));
  }

  if (session.role !== "super-admin" && matchesAnyPrefix(pathname, SUPER_ADMIN_ONLY_PREFIXES)) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_ROUTE, request.url));
  }

  if (session.role !== "student" && matchesAnyPrefix(pathname, STUDENT_ONLY_PREFIXES)) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_ROUTE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
