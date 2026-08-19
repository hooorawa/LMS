import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import UserModel from "@/models/User";
import FeeModel from "@/models/Fee";
import PaymentModel from "@/models/Payment";
import { requireSession, requireRole } from "@/lib/tenant/scope";

export type InstituteHealthRow = {
  id: string;
  name: string;
  code: string;
  status: string;
  activeStudents: number;
  inactiveStudents: number;
  overdueFeeTotal: number;
  lastActivityAt: Date | null;
  monthsOnPlatform: number;
  isInactive: boolean;
};

const INACTIVITY_THRESHOLD_DAYS = 30;

function monthsBetween(from: Date, to: Date): number {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  return Math.max(0, months);
}

export async function listInstituteHealth(): Promise<InstituteHealthRow[]> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();

  const now = new Date();

  const [institutes, students, overdueFees, payments] = await Promise.all([
    InstituteModel.find().select("name code status createdAt").lean(),
    UserModel.find({ role: "student" })
      .select("instituteId status studentMeta.classId lastLoginAt")
      .lean(),
    FeeModel.find({ dueDate: { $lt: now } })
      .select("instituteId amount classId studentId")
      .lean(),
    PaymentModel.find().select("instituteId feeId amount paymentDate").lean(),
  ]);

  const allUsers = await UserModel.find()
    .select("instituteId lastLoginAt")
    .lean();

  const studentsByInstitute = new Map<string, typeof students>();
  for (const student of students) {
    const key = String(student.instituteId);
    const list = studentsByInstitute.get(key) ?? [];
    list.push(student);
    studentsByInstitute.set(key, list);
  }

  const paidByFee = new Map<string, number>();
  for (const payment of payments) {
    if (!payment.feeId) continue;
    const key = String(payment.feeId);
    paidByFee.set(key, (paidByFee.get(key) ?? 0) + payment.amount);
  }

  const lastActivityByInstitute = new Map<string, number>();
  for (const user of allUsers) {
    if (!user.instituteId || !user.lastLoginAt) continue;
    const key = String(user.instituteId);
    const time = new Date(user.lastLoginAt).getTime();
    lastActivityByInstitute.set(key, Math.max(lastActivityByInstitute.get(key) ?? 0, time));
  }
  for (const payment of payments) {
    if (!payment.instituteId || !payment.paymentDate) continue;
    const key = String(payment.instituteId);
    const time = new Date(payment.paymentDate).getTime();
    lastActivityByInstitute.set(key, Math.max(lastActivityByInstitute.get(key) ?? 0, time));
  }

  const overdueByInstitute = new Map<string, number>();
  for (const fee of overdueFees) {
    const instituteKey = String(fee.instituteId);
    const instituteStudents = studentsByInstitute.get(instituteKey) ?? [];

    let applicableCount: number;
    if (fee.studentId) {
      applicableCount = 1;
    } else if (fee.classId) {
      applicableCount = instituteStudents.filter(
        (student) => String(student.studentMeta?.classId ?? "") === String(fee.classId)
      ).length;
    } else {
      applicableCount = instituteStudents.length;
    }

    const assigned = fee.amount * applicableCount;
    const paid = paidByFee.get(String(fee._id)) ?? 0;
    const overdue = Math.max(0, assigned - paid);

    overdueByInstitute.set(instituteKey, (overdueByInstitute.get(instituteKey) ?? 0) + overdue);
  }

  return institutes.map((institute) => {
    const key = String(institute._id);
    const instituteStudents = studentsByInstitute.get(key) ?? [];
    const lastActivityMs = lastActivityByInstitute.get(key);
    const daysSinceActivity = lastActivityMs
      ? (now.getTime() - lastActivityMs) / (1000 * 60 * 60 * 24)
      : null;

    return {
      id: key,
      name: institute.name,
      code: institute.code,
      status: institute.status,
      activeStudents: instituteStudents.filter((student) => student.status === "active").length,
      inactiveStudents: instituteStudents.filter((student) => student.status !== "active").length,
      overdueFeeTotal: overdueByInstitute.get(key) ?? 0,
      lastActivityAt: lastActivityMs ? new Date(lastActivityMs) : null,
      monthsOnPlatform: institute.createdAt ? monthsBetween(new Date(institute.createdAt), now) : 0,
      isInactive: daysSinceActivity === null || daysSinceActivity > INACTIVITY_THRESHOLD_DAYS,
    };
  });
}
