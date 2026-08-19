import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import UserModel from "@/models/User";
import ClassModel from "@/models/Class";
import SubjectModel from "@/models/Subject";
import PaymentModel from "@/models/Payment";
import ExpenseModel from "@/models/Expense";
import ExtraIncomeModel from "@/models/ExtraIncome";
import SubscriptionModel from "@/models/Subscription";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { sweepExpiredTrials, sweepTrialsExpiringSoon, notifyOverdueInvoices } from "@/lib/subscription/lifecycle";

export async function listInstitutes() {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  await sweepExpiredTrials();
  await sweepTrialsExpiringSoon();
  await notifyOverdueInvoices();
  return InstituteModel.find().sort({ createdAt: -1 }).lean();
}

export type InstituteDirectoryItem = {
  id: string;
  name: string;
  code: string;
  status: "trial" | "active" | "past_due" | "suspended" | "cancelled";
  contactEmail?: string;
  phone?: string;
  createdAt?: Date;
  students: number;
  staff: number;
  admins: number;
  classes: number;
  planId?: string;
  planName?: string;
  subscriptionStatus?: string;
  trialEndsAt?: Date;
  currentPeriodEnd?: Date;
  attention: "healthy" | "trial-ending" | "needs-admin" | "past-due" | "suspended" | "unconfigured";
};

export type InstituteDirectorySummary = {
  total: number;
  active: number;
  trial: number;
  needsAttention: number;
  totalStudents: number;
};

/** Builds the super-admin directory without requiring a per-institute query for usage. */
export async function getInstituteDirectory(): Promise<{
  institutes: InstituteDirectoryItem[];
  summary: InstituteDirectorySummary;
}> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  await sweepExpiredTrials();
  await sweepTrialsExpiringSoon();
  await notifyOverdueInvoices();

  const [institutes, userCounts, classCounts, subscriptions] = await Promise.all([
    InstituteModel.find().sort({ createdAt: -1 }).lean(),
    UserModel.aggregate<{ _id: { instituteId: unknown; role: string }; count: number }>([
      { $match: { instituteId: { $ne: null }, role: { $in: ["student", "institute-staff", "institute-admin"] } } },
      { $group: { _id: { instituteId: "$instituteId", role: "$role" }, count: { $sum: 1 } } },
    ]),
    ClassModel.aggregate<{ _id: unknown; count: number }>([
      { $group: { _id: "$instituteId", count: { $sum: 1 } } },
    ]),
    SubscriptionModel.find().populate("planId", "name").lean(),
  ]);

  const peopleByInstitute = new Map<string, { students: number; staff: number; admins: number }>();
  for (const record of userCounts) {
    const id = String(record._id.instituteId);
    const current = peopleByInstitute.get(id) ?? { students: 0, staff: 0, admins: 0 };
    if (record._id.role === "student") current.students = record.count;
    if (record._id.role === "institute-staff") current.staff = record.count;
    if (record._id.role === "institute-admin") current.admins = record.count;
    peopleByInstitute.set(id, current);
  }
  const classesByInstitute = new Map(classCounts.map((record) => [String(record._id), record.count]));
  const subscriptionsByInstitute = new Map(subscriptions.map((subscription) => [String(subscription.instituteId), subscription]));
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 7);

  const directory = institutes.map((institute) => {
    const id = String(institute._id);
    const people = peopleByInstitute.get(id) ?? { students: 0, staff: 0, admins: 0 };
    const subscription = subscriptionsByInstitute.get(id);
    const plan = subscription?.planId as unknown as { _id?: unknown; name?: string } | null | undefined;
    const trialEnding = subscription?.status === "trialing" && subscription.trialEndsAt && subscription.trialEndsAt <= soon;
    let attention: InstituteDirectoryItem["attention"] = "healthy";
    if (institute.status === "suspended" || institute.status === "cancelled") attention = "suspended";
    else if (institute.status === "past_due" || subscription?.status === "past_due") attention = "past-due";
    else if (people.admins === 0) attention = "needs-admin";
    else if (trialEnding) attention = "trial-ending";
    else if (!subscription) attention = "unconfigured";

    return {
      id,
      name: institute.name,
      code: institute.code,
      status: institute.status,
      contactEmail: institute.contactEmail ?? undefined,
      phone: institute.phone ?? undefined,
      createdAt: institute.createdAt ?? undefined,
      students: people.students,
      staff: people.staff,
      admins: people.admins,
      classes: classesByInstitute.get(id) ?? 0,
      planId: plan?._id ? String(plan._id) : undefined,
      planName: plan?.name,
      subscriptionStatus: subscription?.status,
      trialEndsAt: subscription?.trialEndsAt ?? undefined,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? undefined,
      attention,
    };
  });

  return {
    institutes: directory,
    summary: {
      total: directory.length,
      active: directory.filter((institute) => institute.status === "active").length,
      trial: directory.filter((institute) => institute.status === "trial").length,
      needsAttention: directory.filter((institute) => institute.attention !== "healthy").length,
      totalStudents: directory.reduce((total, institute) => total + institute.students, 0),
    },
  };
}

export async function getInstituteById(id: string) {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  await sweepExpiredTrials();
  await sweepTrialsExpiringSoon();
  await notifyOverdueInvoices();
  return InstituteModel.findById(id).lean();
}

export async function countInstitutes(): Promise<number> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  return InstituteModel.countDocuments();
}

export type InstituteSummary = {
  staff: number;
  students: number;
  classes: number;
  subjects: number;
  totalRevenue: number;
  totalExtraIncome: number;
  totalExpenses: number;
  totalSalary: number;
  netIncome: number;
};

export async function getInstituteSummary(instituteId: string): Promise<InstituteSummary> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();

  const [staff, students, classes, subjects, payments, extraIncome, expenses, staffPay] =
    await Promise.all([
      UserModel.countDocuments({ instituteId, role: "institute-staff" }),
      UserModel.countDocuments({ instituteId, role: "student" }),
      ClassModel.countDocuments({ instituteId }),
      SubjectModel.countDocuments({ instituteId }),
      PaymentModel.find({ instituteId }).select("amount").lean(),
      ExtraIncomeModel.find({ instituteId }).select("amount").lean(),
      ExpenseModel.find({ instituteId }).select("price").lean(),
      UserModel.find({ instituteId, role: "institute-staff" })
        .select("staffMeta.basicSalary staffMeta.monthlyCommissions")
        .lean(),
    ]);

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalExtraIncome = extraIncome.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.price, 0);
  const totalSalary = staffPay.reduce((sum, member) => {
    const basicSalary = member.staffMeta?.basicSalary ?? 0;
    const commissions = (member.staffMeta?.monthlyCommissions ?? []).reduce(
      (commissionSum: number, entry: { amount?: number | null }) =>
        commissionSum + (entry.amount ?? 0),
      0
    );
    return sum + basicSalary + commissions;
  }, 0);

  const netIncome = totalRevenue + totalExtraIncome - totalExpenses - totalSalary;

  return {
    staff,
    students,
    classes,
    subjects,
    totalRevenue,
    totalExtraIncome,
    totalExpenses,
    totalSalary,
    netIncome,
  };
}

export type InstituteAdminRow = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  lastLoginAt?: Date;
  createdAt?: Date;
};

export async function getInstituteAdmins(instituteId: string): Promise<InstituteAdminRow[]> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  const admins = await UserModel.find({ instituteId, role: "institute-admin" })
    .sort({ createdAt: -1 })
    .select("name email phone status lastLoginAt createdAt")
    .lean();

  return admins.map((admin) => ({
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    phone: admin.phone ?? undefined,
    status: admin.status,
    lastLoginAt: admin.lastLoginAt ?? undefined,
    createdAt: admin.createdAt ?? undefined,
  }));
}

export type PlatformTrendPoint = {
  month: string;
  institutesCreated: number;
};

export async function getPlatformTrends(months = 6): Promise<PlatformTrendPoint[]> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();

  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1), 1);
  since.setHours(0, 0, 0, 0);

  const institutes = await InstituteModel.find({ createdAt: { $gte: since } })
    .select("createdAt")
    .lean();

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const bucketDate = new Date(since.getFullYear(), since.getMonth() + i, 1);
    const key = bucketDate.toLocaleDateString("en-US", { year: "numeric", month: "short" });
    buckets.set(key, 0);
  }

  for (const institute of institutes) {
    if (!institute.createdAt) continue;
    const key = new Date(institute.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([month, institutesCreated]) => ({
    month,
    institutesCreated,
  }));
}
