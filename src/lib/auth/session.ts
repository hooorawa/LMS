import "server-only";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { Role } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

const COOKIE_NAME = "lms_session";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 1 day

export type SessionPayload = {
  userId: string;
  role: Role;
  instituteId: string | null;
  mustChangePassword: boolean;
  /** Present only while a super-admin is acting as an institute administrator. */
  impersonatedBy?: string;
  impersonatedByEmail?: string;
};

export function signSession(payload: SessionPayload, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: ttlSeconds });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET as string) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const token = signSession(payload, ttlSeconds);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttlSeconds,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
