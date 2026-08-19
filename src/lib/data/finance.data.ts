import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import ExpenseModel from "@/models/Expense";
import ExtraIncomeModel from "@/models/ExtraIncome";
import FeeModel from "@/models/Fee";
import PaymentModel from "@/models/Payment";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

type CommissionEntry = {
  month?: string | null;
  amount?: number | null;
  recordedAt?: Date | null;
};

export async function listExpenses() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ExpenseModel.find(withTenantScope({}, session)).sort({ createdAt: -1 }).lean();
}

export async function getExpenseForInstitute(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ExpenseModel.findOne(withTenantScope({ _id: id }, session)).lean();
}

export async function listExtraIncome() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ExtraIncomeModel.find(withTenantScope({}, session)).sort({ createdAt: -1 }).lean();
}

export async function getExtraIncomeForInstitute(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ExtraIncomeModel.findOne(withTenantScope({ _id: id }, session)).lean();
}

export type IncomeStatistics = {
  totalRevenue: number;
  totalExtraIncome: number;
  totalExpenses: number;
  totalSalary: number;
  netIncome: number;
};

export async function getIncomeStatistics(): Promise<IncomeStatistics> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const [payments, extraIncome, expenses, staff] = await Promise.all([
    PaymentModel.find(withTenantScope({}, session)).select("amount").lean(),
    ExtraIncomeModel.find(withTenantScope({}, session)).select("amount").lean(),
    ExpenseModel.find(withTenantScope({}, session)).select("price").lean(),
    UserModel.find(withTenantScope({ role: "institute-staff" }, session))
      .select("staffMeta.basicSalary staffMeta.monthlyCommissions")
      .lean(),
  ]);

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalExtraIncome = extraIncome.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.price, 0);
  const totalSalary = staff.reduce((sum, member) => {
    const basicSalary = member.staffMeta?.basicSalary ?? 0;
    const commissions = (member.staffMeta?.monthlyCommissions ?? []).reduce(
      (commissionSum: number, entry: { amount?: number | null }) =>
        commissionSum + (entry.amount ?? 0),
      0
    );
    return sum + basicSalary + commissions;
  }, 0);

  const netIncome = totalRevenue + totalExtraIncome - totalExpenses - totalSalary;

  return { totalRevenue, totalExtraIncome, totalExpenses, totalSalary, netIncome };
}

export type FinanceTrendPoint = {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
};

export async function getFinanceTrend(months = 6): Promise<FinanceTrendPoint[]> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1), 1);
  since.setHours(0, 0, 0, 0);

  const [payments, extraIncome, expenses] = await Promise.all([
    PaymentModel.find(withTenantScope({ paymentDate: { $gte: since } }, session))
      .select("amount paymentDate")
      .lean(),
    ExtraIncomeModel.find(withTenantScope({}, session)).select("amount createdAt").lean(),
    ExpenseModel.find(withTenantScope({}, session)).select("price createdAt").lean(),
  ]);

  const monthKey = (date: Date) => date.toLocaleDateString("en-US", { year: "numeric", month: "short" });

  const revenueBuckets = new Map<string, number>();
  const expenseBuckets = new Map<string, number>();
  const order: string[] = [];
  for (let i = 0; i < months; i++) {
    const bucketDate = new Date(since.getFullYear(), since.getMonth() + i, 1);
    const key = monthKey(bucketDate);
    order.push(key);
    revenueBuckets.set(key, 0);
    expenseBuckets.set(key, 0);
  }

  for (const payment of payments) {
    const key = monthKey(new Date(payment.paymentDate));
    if (revenueBuckets.has(key)) revenueBuckets.set(key, (revenueBuckets.get(key) ?? 0) + payment.amount);
  }
  for (const income of extraIncome) {
    const key = monthKey(new Date(income.createdAt as Date));
    if (revenueBuckets.has(key)) revenueBuckets.set(key, (revenueBuckets.get(key) ?? 0) + income.amount);
  }
  for (const expense of expenses) {
    const key = monthKey(new Date(expense.createdAt as Date));
    if (expenseBuckets.has(key)) expenseBuckets.set(key, (expenseBuckets.get(key) ?? 0) + expense.price);
  }

  return order.map((month) => {
    const revenue = revenueBuckets.get(month) ?? 0;
    const expensesTotal = expenseBuckets.get(month) ?? 0;
    return { month, revenue, expenses: expensesTotal, net: revenue - expensesTotal };
  });
}

export async function getSalaryLedger() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const staff = await UserModel.find(withTenantScope({ role: "institute-staff" }, session))
    .select("name email status staffMeta.employeeCode staffMeta.basicSalary staffMeta.monthlyCommissions")
    .sort({ name: 1 })
    .lean();

  return staff.map((member) => {
    const commissions = ((member.staffMeta?.monthlyCommissions ?? []) as CommissionEntry[])
      .slice()
      .sort(
        (a: CommissionEntry, b: CommissionEntry) =>
          new Date(b.recordedAt ?? 0).getTime() - new Date(a.recordedAt ?? 0).getTime()
      );
    const totalCommission = commissions.reduce(
      (sum: number, entry: CommissionEntry) => sum + (entry.amount ?? 0),
      0
    );

    return {
      id: String(member._id),
      name: member.name,
      email: member.email,
      status: member.status,
      employeeCode: member.staffMeta?.employeeCode ?? "",
      basicSalary: member.staffMeta?.basicSalary ?? 0,
      totalCommission,
      totalCompensation: (member.staffMeta?.basicSalary ?? 0) + totalCommission,
      commissionCount: commissions.length,
      latestCommission:
        commissions[0]
          ? {
              month: commissions[0].month ?? "",
              amount: commissions[0].amount ?? 0,
              recordedAt: commissions[0].recordedAt ?? null,
            }
          : null,
    };
  });
}

export async function getCommissionLedger() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const staff = await UserModel.find(withTenantScope({ role: "institute-staff" }, session))
    .select("name status staffMeta.employeeCode staffMeta.monthlyCommissions")
    .sort({ name: 1 })
    .lean();

  const entries = staff.flatMap((member) =>
    ((member.staffMeta?.monthlyCommissions ?? []) as CommissionEntry[]).map((entry: CommissionEntry, index: number) => ({
      key: `${member._id}-${index}`,
      staffId: String(member._id),
      staffName: member.name,
      employeeCode: member.staffMeta?.employeeCode ?? "",
      status: member.status,
      month: entry.month ?? "",
      amount: entry.amount ?? 0,
      recordedAt: entry.recordedAt ?? null,
    }))
  );

  const monthlyTotals = new Map<string, number>();
  for (const entry of entries) {
    monthlyTotals.set(entry.month, (monthlyTotals.get(entry.month) ?? 0) + entry.amount);
  }

  return {
    entries: entries.sort(
      (a, b) => new Date(b.recordedAt ?? 0).getTime() - new Date(a.recordedAt ?? 0).getTime()
    ),
    monthlyTotals: [...monthlyTotals.entries()]
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  };
}

export async function getPaymentDeskSnapshot() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const [students, fees, payments] = await Promise.all([
    UserModel.find(withTenantScope({ role: "student" }, session))
      .select("name email status studentMeta.rollNumber studentMeta.classId")
      .sort({ name: 1 })
      .lean(),
    FeeModel.find(withTenantScope({}, session))
      .select("title amount dueDate studentId classId")
      .lean(),
    PaymentModel.find(withTenantScope({}, session))
      .select("studentId feeId amount paymentDate receiptNumber paymentMethod")
      .sort({ paymentDate: -1 })
      .lean(),
  ]);

  const now = new Date();
  const paidByFee = new Map<string, number>();
  const paymentsByStudent = new Map<string, typeof payments>();
  for (const payment of payments) {
    const studentId = String(payment.studentId);
    const studentPayments = paymentsByStudent.get(studentId) ?? [];
    studentPayments.push(payment);
    paymentsByStudent.set(studentId, studentPayments);

    if (payment.feeId) {
      const feeId = String(payment.feeId);
      paidByFee.set(feeId, (paidByFee.get(feeId) ?? 0) + payment.amount);
    }
  }

  const rows = students.map((student) => {
    const studentId = String(student._id);
    const classId = student.studentMeta?.classId ? String(student.studentMeta.classId) : null;
    const applicableFees = fees
      .filter((fee) => {
        const feeStudentId = fee.studentId ? String(fee.studentId) : null;
        const feeClassId = fee.classId ? String(fee.classId) : null;
        if (feeStudentId) return feeStudentId === studentId;
        if (feeClassId) return feeClassId === classId;
        return true;
      })
      .map((fee) => ({
        feeId: String(fee._id),
        title: fee.title,
        amount: fee.amount,
        dueDate: fee.dueDate,
      }));
    const totalDue = applicableFees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalPaid = (paymentsByStudent.get(studentId) ?? []).reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const overdueAmount = applicableFees.reduce((sum, fee) => {
      const balance = fee.amount - (paidByFee.get(fee.feeId) ?? 0);
      return fee.dueDate.getTime() < now.getTime() && balance > 0 ? sum + balance : sum;
    }, 0);

    const nextDue = applicableFees
      .map((fee) => ({
        title: fee.title,
        dueDate: fee.dueDate,
        balance: fee.amount - (paidByFee.get(fee.feeId) ?? 0),
      }))
      .filter((fee) => fee.balance > 0)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0] ?? null;

    return {
      id: studentId,
      name: student.name,
      email: student.email,
      status: student.status,
      rollNumber: student.studentMeta?.rollNumber ?? "",
      totalDue,
      totalPaid,
      balance: totalDue - totalPaid,
      overdueAmount,
      nextDue,
      feeCount: applicableFees.length,
      recentPayment: (paymentsByStudent.get(studentId) ?? [])[0] ?? null,
    };
  });

  return {
    students: rows,
    summary: {
      studentCount: rows.length,
      outstandingCount: rows.filter((row) => row.balance > 0).length,
      overdueCount: rows.filter((row) => row.overdueAmount > 0).length,
      outstandingAmount: rows.reduce((sum, row) => sum + Math.max(row.balance, 0), 0),
      overdueAmount: rows.reduce((sum, row) => sum + row.overdueAmount, 0),
    },
  };
}
