import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import FeeModel from "@/models/Fee";
import FeeConcessionModel from "@/models/FeeConcession";
import PaymentModel from "@/models/Payment";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export async function listFeesForInstitute() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return FeeModel.find(withTenantScope({}, session))
    .populate("classId", "name section")
    .populate("studentId", "name")
    .sort({ dueDate: -1 })
    .lean();
}

export async function getFeeForInstitute(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return FeeModel.findOne(withTenantScope({ _id: id }, session)).lean();
}

export async function getStudentFeeOverview(studentId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin", "student"]);

  if (session.role === "student" && session.userId !== studentId) {
    throw new Error("Resource not found");
  }

  await connectToDatabase();

  const student = await UserModel.findOne(
    withTenantScope({ _id: studentId, role: "student" }, session)
  )
    .select("name studentMeta.classId studentMeta.rollNumber")
    .lean();
  if (!student) return null;

  const classId = student.studentMeta?.classId ?? null;

  const fees = await FeeModel.find({
    instituteId: session.instituteId,
    $or: [
      { studentId: student._id },
      ...(classId ? [{ classId, studentId: null }] : []),
      { classId: null, studentId: null },
    ],
  })
    .sort({ dueDate: 1 })
    .lean();

  const payments = await PaymentModel.find({
    instituteId: session.instituteId,
    studentId: student._id,
  })
    .populate("feeId", "title")
    .sort({ paymentDate: -1 })
    .lean();
  const concessions = await FeeConcessionModel.find({
    instituteId: session.instituteId,
    studentId: student._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  const paidByFee = new Map<string, number>();
  for (const payment of payments) {
    if (payment.feeId) {
      const key =
        typeof payment.feeId === "object" && "_id" in payment.feeId
          ? String(payment.feeId._id)
          : String(payment.feeId);
      paidByFee.set(key, (paidByFee.get(key) ?? 0) + payment.amount);
    }
  }

  const feesWithBalance = fees.map((fee) => {
    const paid = paidByFee.get(fee._id.toString()) ?? 0;
    const discount = concessions
      .filter((concession) => !concession.feeId || concession.feeId.toString() === fee._id.toString())
      .reduce((sum, concession) => {
        const amount = concession.type === "percent" ? fee.amount * (concession.value / 100) : concession.value;
        return sum + Math.min(fee.amount, amount);
      }, 0);
    const netAmount = Math.max(0, fee.amount - discount);
    return {
      id: fee._id.toString(),
      title: fee.title,
      amount: fee.amount,
      discount,
      netAmount,
      dueDate: fee.dueDate,
      academicYear: fee.academicYear,
      frequency: fee.frequency,
      paid,
      balance: netAmount - paid,
    };
  });

  const totalDue = feesWithBalance.reduce((sum, fee) => sum + fee.netAmount, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    student: {
      id: student._id.toString(),
      name: student.name,
      rollNumber: student.studentMeta?.rollNumber ?? "",
    },
    fees: feesWithBalance,
    payments: payments.map((payment) => ({
      id: payment._id.toString(),
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      receiptNumber: payment.receiptNumber,
      feeTitle:
        payment.feeId && typeof payment.feeId === "object" && "title" in payment.feeId
          ? (payment.feeId as { title: string }).title
          : null,
    })),
    concessions: concessions.map((concession) => ({
      id: concession._id.toString(),
      title: concession.title,
      type: concession.type,
      value: concession.value,
      reason: concession.reason ?? "",
      feeId: concession.feeId?.toString() ?? null,
    })),
    totalDue,
    totalPaid,
    balance: totalDue - totalPaid,
  };
}
