import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import { requireSession } from "@/lib/tenant/scope";

export async function getMyProfile() {
  const session = await requireSession();

  await connectToDatabase();
  const user = await UserModel.findById(session.userId)
    .select("name email phone avatarUrl role notificationPreferences employeeCode staffMeta studentMeta")
    .lean();

  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    avatarUrl: user.avatarUrl ?? "",
    role: user.role,
    notificationPreferences: {
      announcements: user.notificationPreferences?.announcements ?? true,
      billing: user.notificationPreferences?.billing ?? true,
      academic: user.notificationPreferences?.academic ?? true,
    },
    staffMeta: user.staffMeta
      ? {
          employeeCode: user.staffMeta.employeeCode ?? null,
          subjectIds: (user.staffMeta.subjectIds ?? []).map((id: unknown) => String(id)),
          basicSalary: user.staffMeta.basicSalary ?? 0,
          commission: user.staffMeta.commission ?? 0,
          monthlyCommissions: (user.staffMeta.monthlyCommissions ?? []).map((entry: { month?: string; amount?: number; recordedAt?: Date }) => ({
            month: entry.month,
            amount: entry.amount,
            recordedAt: entry.recordedAt,
          })),
          permissions: user.staffMeta.permissions ?? null,
        }
      : null,
    studentMeta: user.studentMeta ?? null,
  };
}
