import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import PaymentModel from "@/models/Payment";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export async function listRecentPaymentsForInstitute(limit = 10) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return PaymentModel.find(withTenantScope({}, session))
    .populate("studentId", "name")
    .sort({ paymentDate: -1 })
    .limit(limit)
    .lean();
}

export async function getRecentFeeCollectionSummary(days = 30) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const payments = await PaymentModel.find(
    withTenantScope({ paymentDate: { $gte: since } }, session)
  )
    .select("amount")
    .lean();

  return {
    totalCollected: payments.reduce((sum, payment) => sum + payment.amount, 0),
    paymentCount: payments.length,
  };
}
