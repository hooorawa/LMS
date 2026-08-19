import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { generateAutomaticReminders } from "@/lib/actions/reminder.actions";

export async function POST() {
  const session = await getSession();
  if (!session || !["super-admin", "institute-admin"].includes(session.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const result = await generateAutomaticReminders();
  return NextResponse.json(result);
}
