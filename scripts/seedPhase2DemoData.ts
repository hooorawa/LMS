import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import UserModel from "@/models/User";
import ClassModel from "@/models/Class";
import SubscriptionPlanModel from "@/models/SubscriptionPlan";
import SubscriptionModel from "@/models/Subscription";
import PlatformInvoiceModel from "@/models/PlatformInvoice";
import FeeModel from "@/models/Fee";
import PaymentModel from "@/models/Payment";
import AuditLogModel from "@/models/AuditLog";
import { hashPassword } from "@/lib/auth/password";

const DEMO_PASSWORD = "Password123!";
const DAY = 24 * 60 * 60 * 1000;

const INSTITUTE_CODES = ["ACT", "TRL", "SUS", "PDU", "STL"];

async function wipeInstitute(code: string) {
  const existing = await InstituteModel.findOne({ code });
  if (!existing) return;

  const instituteId = existing._id;
  await Promise.all([
    UserModel.deleteMany({ instituteId }),
    ClassModel.deleteMany({ instituteId }),
    FeeModel.deleteMany({ instituteId }),
    PaymentModel.deleteMany({ instituteId }),
    SubscriptionModel.deleteMany({ instituteId }),
    PlatformInvoiceModel.deleteMany({ instituteId }),
    AuditLogModel.deleteMany({ instituteId }),
  ]);
  await InstituteModel.deleteOne({ _id: instituteId });
}

async function getOrCreatePlans() {
  const defs = [
    {
      name: "Starter",
      slug: "starter",
      description: "Small institutes just getting going.",
      price: 49,
      billingInterval: "monthly" as const,
      sortOrder: 1,
    },
    {
      name: "Growth",
      slug: "growth",
      description: "Mid-size institutes with multiple classes.",
      price: 99,
      billingInterval: "monthly" as const,
      sortOrder: 2,
    },
    {
      name: "Pro Yearly",
      slug: "pro-yearly",
      description: "Full platform access, billed yearly.",
      price: 999,
      billingInterval: "yearly" as const,
      sortOrder: 3,
    },
  ];

  const plans: Record<string, InstanceType<typeof SubscriptionPlanModel>> = {};
  for (const def of defs) {
    let plan = await SubscriptionPlanModel.findOne({ slug: def.slug });
    if (!plan) {
      plan = await SubscriptionPlanModel.create({
        name: def.name,
        slug: def.slug,
        description: def.description,
        price: def.price,
        currency: "USD",
        billingInterval: def.billingInterval,
        limits: { maxStudents: null, maxStaff: null, maxClasses: null, maxSubjects: null, storageMb: null },
        features: ["Core academics", "Fee management", "Attendance"],
        isActive: true,
        isPublic: true,
        sortOrder: def.sortOrder,
      });
    }
    plans[def.slug] = plan;
  }
  return plans;
}

async function createInstituteWithAdmin(opts: {
  name: string;
  code: string;
  status: "trial" | "active" | "past_due" | "suspended" | "cancelled";
  contactEmail: string;
  passwordHash: string;
  createdAtDaysAgo: number;
}) {
  const institute = await InstituteModel.create({
    name: opts.name,
    code: opts.code,
    status: opts.status,
    contactEmail: opts.contactEmail,
    phone: "011-000-0000",
    address: "Colombo, Sri Lanka",
    createdAt: new Date(Date.now() - opts.createdAtDaysAgo * DAY),
    createdBy: new mongoose.Types.ObjectId(),
  });

  const admin = await UserModel.create({
    name: `${opts.name} Admin`,
    email: `admin@${opts.code.toLowerCase()}.edu`,
    passwordHash: opts.passwordHash,
    role: "institute-admin",
    instituteId: institute._id,
    status: "active",
    mustChangePassword: false,
    createdAt: new Date(Date.now() - opts.createdAtDaysAgo * DAY),
  });

  await InstituteModel.updateOne({ _id: institute._id }, { createdBy: admin._id });

  return { institute, admin };
}

async function seedClassAndStudents(
  instituteId: string,
  adminId: string,
  passwordHash: string,
  code: string,
  count: number,
  opts: { suspendedCount?: number; lastLoginDaysAgo?: (index: number) => number | null } = {}
) {
  const klass = await ClassModel.create({
    instituteId,
    name: "Grade 6",
    section: "A",
    academicYear: "2025/2026",
    status: "active",
    createdBy: adminId,
  });

  const students = [];
  for (let i = 0; i < count; i++) {
    const suspended = opts.suspendedCount ? i < opts.suspendedCount : false;
    const lastLoginDaysAgo = opts.lastLoginDaysAgo ? opts.lastLoginDaysAgo(i) : 1;
    const student = await UserModel.create({
      name: `${code} Student ${i + 1}`,
      email: `student${i + 1}@${code.toLowerCase()}.edu`,
      passwordHash,
      role: "student",
      instituteId,
      status: suspended ? "suspended" : "active",
      mustChangePassword: false,
      lastLoginAt: lastLoginDaysAgo === null ? undefined : new Date(Date.now() - lastLoginDaysAgo * DAY),
      studentMeta: {
        rollNumber: `${code}-${String(i + 1).padStart(3, "0")}`,
        classId: klass._id,
        guardianName: "Guardian",
        guardianPhone: "077-000-0000",
      },
      createdBy: adminId,
    });
    students.push(student);
  }

  return { klass, students };
}

async function seedFeesAndPayments(
  instituteId: string,
  adminId: string,
  klassId: string,
  students: InstanceType<typeof UserModel>[],
  opts: { paidRatio: number; dueDaysAgo: number }
) {
  const fee = await FeeModel.create({
    instituteId,
    classId: klassId,
    studentId: null,
    title: "Term 2 Tuition Fee",
    amount: 5000,
    dueDate: new Date(Date.now() - opts.dueDaysAgo * DAY),
    academicYear: "2025/2026",
    frequency: "term",
    createdBy: adminId,
  });

  const payingCount = Math.round(students.length * opts.paidRatio);
  for (let i = 0; i < payingCount; i++) {
    await PaymentModel.create({
      instituteId,
      studentId: students[i]._id,
      feeId: fee._id,
      amount: 5000,
      paymentMethod: "cash",
      paymentDate: new Date(Date.now() - (opts.dueDaysAgo - 2) * DAY),
      receiptNumber: `${String(students[i]._id).slice(-6)}-R1`,
      recordedBy: adminId,
    });
  }

  return fee;
}

async function seedInvoices(
  instituteId: string,
  subscriptionId: string,
  planId: string,
  planName: string,
  adminId: string,
  opts: {
    paidMonthsBack?: number[];
    overdueCount?: number;
    discountedOne?: boolean;
    monthlyAmount: number;
  }
) {
  let seq = 1;
  const invoiceNumber = () => `INV-${instituteId.toString().slice(-4)}-${String(seq++).padStart(3, "0")}`;

  for (const monthsBack of opts.paidMonthsBack ?? []) {
    const issuedAt = new Date();
    issuedAt.setMonth(issuedAt.getMonth() - monthsBack, 5);
    const periodStart = new Date(issuedAt);
    const periodEnd = new Date(issuedAt);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const dueAt = new Date(issuedAt);
    dueAt.setDate(dueAt.getDate() + 7);
    const paidAt = new Date(issuedAt);
    paidAt.setDate(paidAt.getDate() + 3);

    const isDiscounted = opts.discountedOne && monthsBack === (opts.paidMonthsBack?.[0] ?? -1);

    await PlatformInvoiceModel.create({
      instituteId,
      subscriptionId,
      planId,
      planNameSnapshot: planName,
      invoiceNumber: invoiceNumber(),
      periodStart,
      periodEnd,
      amount: opts.monthlyAmount,
      currency: "USD",
      status: "paid",
      issuedAt,
      dueAt,
      paidAt,
      paymentMethod: "bank-transfer",
      receiptNumber: `RCPT-${invoiceNumber()}`,
      discountAmount: isDiscounted ? 10 : 0,
      discountReason: isDiscounted ? "Loyalty discount" : undefined,
      recordedBy: adminId,
    });
  }

  for (let i = 0; i < (opts.overdueCount ?? 0); i++) {
    const issuedAt = new Date(Date.now() - (40 + i * 10) * DAY);
    const periodStart = new Date(issuedAt);
    const periodEnd = new Date(issuedAt);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const dueAt = new Date(issuedAt);
    dueAt.setDate(dueAt.getDate() + 10);

    await PlatformInvoiceModel.create({
      instituteId,
      subscriptionId,
      planId,
      planNameSnapshot: planName,
      invoiceNumber: invoiceNumber(),
      periodStart,
      periodEnd,
      amount: opts.monthlyAmount,
      currency: "USD",
      status: "pending",
      issuedAt,
      dueAt,
      recordedBy: adminId,
    });
  }
}

async function main() {
  await connectToDatabase();

  console.log("Wiping previous phase-2 demo institutes...");
  await Promise.all(INSTITUTE_CODES.map(wipeInstitute));

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const plans = await getOrCreatePlans();

  // 1. Active, healthy institute — normal revenue history, upcoming renewal.
  const { institute: active, admin: activeAdmin } = await createInstituteWithAdmin({
    name: "Ace Academy",
    code: "ACT",
    status: "active",
    contactEmail: "info@act.edu",
    passwordHash,
    createdAtDaysAgo: 260,
  });
  const activeSub = await SubscriptionModel.create({
    instituteId: active._id,
    planId: plans.growth._id,
    status: "active",
    currentPeriodStart: new Date(Date.now() - 10 * DAY),
    currentPeriodEnd: new Date(Date.now() + 20 * DAY),
    autoRenew: true,
    createdBy: activeAdmin._id,
  });
  await seedInvoices(String(active._id), String(activeSub._id), String(plans.growth._id), "Growth", String(activeAdmin._id), {
    paidMonthsBack: [5, 4, 3, 2, 1, 0],
    monthlyAmount: 99,
    discountedOne: true,
  });
  const { klass: activeClass, students: activeStudents } = await seedClassAndStudents(
    String(active._id),
    String(activeAdmin._id),
    passwordHash,
    "ACT",
    12,
    { lastLoginDaysAgo: (i) => (i % 5) }
  );
  await seedFeesAndPayments(String(active._id), String(activeAdmin._id), String(activeClass._id), activeStudents, {
    paidRatio: 0.7,
    dueDaysAgo: 15,
  });

  // 2. Trialing institute, trial ends in 2 days — exercises dunning + trial-ending alert.
  const { institute: trial, admin: trialAdmin } = await createInstituteWithAdmin({
    name: "Trailblazer School",
    code: "TRL",
    status: "trial",
    contactEmail: "info@trl.edu",
    passwordHash,
    createdAtDaysAgo: 12,
  });
  await InstituteModel.updateOne({ _id: trial._id }, { trialEndsAt: new Date(Date.now() + 2 * DAY) });
  await SubscriptionModel.create({
    instituteId: trial._id,
    planId: plans.starter._id,
    status: "trialing",
    trialEndsAt: new Date(Date.now() + 2 * DAY),
    autoRenew: true,
    createdBy: trialAdmin._id,
  });
  await seedClassAndStudents(String(trial._id), String(trialAdmin._id), passwordHash, "TRL", 4, {
    lastLoginDaysAgo: () => 1,
  });

  // 3. Suspended institute — exercises suspended-institute alert.
  const { institute: suspended, admin: suspendedAdmin } = await createInstituteWithAdmin({
    name: "Suspended Institute",
    code: "SUS",
    status: "suspended",
    contactEmail: "info@sus.edu",
    passwordHash,
    createdAtDaysAgo: 90,
  });
  await SubscriptionModel.create({
    instituteId: suspended._id,
    planId: plans.starter._id,
    status: "suspended",
    suspendedAt: new Date(Date.now() - 5 * DAY),
    suspendReason: "Non-payment",
    autoRenew: false,
    createdBy: suspendedAdmin._id,
  });

  // 4. Active institute with overdue invoices — exercises overdue-invoice alert + billing total.
  const { institute: pastDue, admin: pastDueAdmin } = await createInstituteWithAdmin({
    name: "Past Due College",
    code: "PDU",
    status: "active",
    contactEmail: "info@pdu.edu",
    passwordHash,
    createdAtDaysAgo: 150,
  });
  const pastDueSub = await SubscriptionModel.create({
    instituteId: pastDue._id,
    planId: plans.growth._id,
    status: "active",
    currentPeriodStart: new Date(Date.now() - 40 * DAY),
    currentPeriodEnd: new Date(Date.now() + 20 * DAY),
    autoRenew: true,
    createdBy: pastDueAdmin._id,
  });
  await seedInvoices(String(pastDue._id), String(pastDueSub._id), String(plans.growth._id), "Growth", String(pastDueAdmin._id), {
    paidMonthsBack: [3, 2],
    overdueCount: 3,
    monthlyAmount: 99,
  });
  const { klass: pduClass, students: pduStudents } = await seedClassAndStudents(
    String(pastDue._id),
    String(pastDueAdmin._id),
    passwordHash,
    "PDU",
    10,
    { lastLoginDaysAgo: (i) => (i % 3) }
  );
  await seedFeesAndPayments(String(pastDue._id), String(pastDueAdmin._id), String(pduClass._id), pduStudents, {
    paidRatio: 0.3,
    dueDaysAgo: 20,
  });

  // 5. Stale institute — no recent activity, unpaid fees — exercises inactive-institute alert + health page.
  const { institute: stale, admin: staleAdmin } = await createInstituteWithAdmin({
    name: "Stale Institute",
    code: "STL",
    status: "active",
    contactEmail: "info@stl.edu",
    passwordHash,
    createdAtDaysAgo: 400,
  });
  const staleSub = await SubscriptionModel.create({
    instituteId: stale._id,
    planId: plans.starter._id,
    status: "active",
    currentPeriodStart: new Date(Date.now() - 200 * DAY),
    currentPeriodEnd: new Date(Date.now() + 165 * DAY),
    autoRenew: true,
    createdBy: staleAdmin._id,
  });
  await seedInvoices(String(stale._id), String(staleSub._id), String(plans.starter._id), "Starter", String(staleAdmin._id), {
    paidMonthsBack: [6, 5],
    monthlyAmount: 49,
  });
  const { klass: staleClass, students: staleStudents } = await seedClassAndStudents(
    String(stale._id),
    String(staleAdmin._id),
    passwordHash,
    "STL",
    8,
    { suspendedCount: 3, lastLoginDaysAgo: () => 60 }
  );
  await seedFeesAndPayments(String(stale._id), String(staleAdmin._id), String(staleClass._id), staleStudents, {
    paidRatio: 0,
    dueDaysAgo: 90,
  });

  // Second admin on Ace Academy — exercises admin add/reset/remove UI (there are 2, so removal is allowed).
  const secondAdmin = await UserModel.create({
    name: "Ace Academy Co-Admin",
    email: "coadmin@act.edu",
    passwordHash,
    role: "institute-admin",
    instituteId: active._id,
    status: "active",
    mustChangePassword: false,
  });

  // Deletion-spike: a burst of "delete"/"remove" audit entries on Past Due College in the last few hours.
  const deletionEntries = Array.from({ length: 6 }).map((_, i) => ({
    instituteId: pastDue._id,
    actorUserId: pastDueAdmin._id,
    actorName: pastDueAdmin.name,
    actorRole: "institute-admin",
    action: "student.delete",
    targetType: "User",
    targetId: pduStudents[i % pduStudents.length]._id,
    targetName: pduStudents[i % pduStudents.length].name,
    summary: `Removed student ${pduStudents[i % pduStudents.length].name}`,
    createdAt: new Date(Date.now() - i * 60 * 60 * 1000),
  }));
  await AuditLogModel.insertMany(deletionEntries);

  // A few ordinary audit entries across institutes so /audit-log has variety to filter on.
  await AuditLogModel.insertMany([
    {
      instituteId: active._id,
      actorUserId: activeAdmin._id,
      actorName: activeAdmin.name,
      actorRole: "institute-admin",
      action: "class.create",
      targetType: "Class",
      targetId: activeClass._id,
      targetName: "Grade 6 A",
      summary: "Created class Grade 6 A",
      createdAt: new Date(Date.now() - 3 * DAY),
    },
    {
      instituteId: trial._id,
      actorUserId: trialAdmin._id,
      actorName: trialAdmin.name,
      actorRole: "institute-admin",
      action: "student.create",
      targetType: "User",
      targetId: trialAdmin._id,
      targetName: "New student",
      summary: "Enrolled a new student",
      createdAt: new Date(Date.now() - 1 * DAY),
    },
  ]);

  console.log("Phase 2 demo seed complete.");
  console.log("");
  console.log(`Shared demo password: ${DEMO_PASSWORD}`);
  console.log("");
  console.log("Institutes created:");
  console.log("  Ace Academy (ACT)         - active, healthy, 6mo revenue history, 2 admins (coadmin@act.edu)");
  console.log("  Trailblazer School (TRL)  - trial ending in 2 days -> visit /institutes to trigger dunning");
  console.log("  Suspended Institute (SUS) - suspended -> suspended-institute alert");
  console.log("  Past Due College (PDU)    - 3 overdue invoices + deletion spike -> overdue/anomaly alerts");
  console.log("  Stale Institute (STL)     - no recent activity, unpaid fees -> inactive-institute alert");
  console.log("");
  console.log("Visit /institutes (or log in) once as super-admin to trigger the lazy sweep");
  console.log("that flips overdue invoices/notifications and populates the alert feed.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
