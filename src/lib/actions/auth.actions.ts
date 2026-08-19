"use server";

import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel, { type Role } from "@/models/User";
import InstituteModel from "@/models/Institute";
import SubscriptionModel from "@/models/Subscription";
import { comparePassword, hashPassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth/session";
import { evaluateAndSyncSubscriptionStatus, checkTrialExpiringSoon, notifyOverdueInvoices } from "@/lib/subscription/lifecycle";
import { loginSchema, changePasswordSchema } from "@/lib/validation/auth.schema";

export type LoginState = {
  error?: string;
};

const ROLE_HOME: Record<Role, string> = {
  "super-admin": "/dashboard",
  "institute-admin": "/dashboard",
  "institute-staff": "/dashboard",
  student: "/dashboard",
};

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  await connectToDatabase();

  const user = await UserModel.findOne({ email: parsed.data.email.toLowerCase() }).select(
    "+passwordHash"
  );

  if (!user || user.status !== "active") {
    return { error: "Invalid email or password." };
  }

  const isValid = await comparePassword(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return { error: "Invalid email or password." };
  }

  if (user.role !== "super-admin" && user.instituteId) {
    const subscription = await SubscriptionModel.findOne({ instituteId: user.instituteId });
    if (subscription) {
      await evaluateAndSyncSubscriptionStatus(subscription);
      await checkTrialExpiringSoon(subscription);
    }
    await notifyOverdueInvoices(user.instituteId.toString());

    const institute = await InstituteModel.findById(user.instituteId).select("status");
    if (institute?.status === "suspended") {
      return { error: "This institute's account is suspended. Contact support." };
    }
    if (institute?.status === "cancelled") {
      return { error: "This institute's account has been cancelled. Contact support." };
    }
  }

  user.lastLoginAt = new Date();
  await user.save();

  await setSessionCookie({
    userId: user._id.toString(),
    role: user.role as Role,
    instituteId: user.instituteId ? user.instituteId.toString() : null,
    mustChangePassword: user.mustChangePassword,
  });

  redirect(user.mustChangePassword ? "/change-password" : ROLE_HOME[user.role as Role]);
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}

export type ChangePasswordState = {
  error?: string;
};

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const user = await UserModel.findById(session.userId).select("+passwordHash");
  if (!user) {
    redirect("/login");
  }

  const isValid = await comparePassword(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) {
    return { error: "Current password is incorrect." };
  }

  user.passwordHash = await hashPassword(parsed.data.newPassword);
  user.mustChangePassword = false;
  await user.save();

  await setSessionCookie({
    userId: session.userId,
    role: session.role,
    instituteId: session.instituteId,
    mustChangePassword: false,
  });

  redirect(ROLE_HOME[session.role]);
}
