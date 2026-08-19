import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import SubscriptionModel from "@/models/Subscription";
import PlatformInvoiceModel from "@/models/PlatformInvoice";
import UserModel from "@/models/User";
import NotificationModel from "@/models/Notification";
import AuditLogModel from "@/models/AuditLog";

type SubscriptionDoc = InstanceType<typeof SubscriptionModel>;
type InvoiceDoc = InstanceType<typeof PlatformInvoiceModel>;

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_THROTTLE_MS = DAY_MS;

/**
 * Flips a trialing subscription (and its mirrored Institute.status) to
 * "suspended" once trialEndsAt has passed. No-op if no transition is needed.
 * Returns true when a transition happened.
 */
export async function evaluateAndSyncSubscriptionStatus(
  subscription: SubscriptionDoc
): Promise<boolean> {
  if (subscription.status !== "trialing") return false;
  if (!subscription.trialEndsAt || subscription.trialEndsAt >= new Date()) return false;

  const institute = await InstituteModel.findById(subscription.instituteId);
  if (!institute) return false;

  subscription.status = "suspended";
  subscription.suspendedAt = new Date();
  subscription.suspendReason = "Trial period expired";
  await subscription.save();

  institute.status = "suspended";
  await institute.save();

  const actorUserId = institute.createdBy ?? subscription.createdBy;
  await AuditLogModel.create({
    instituteId: institute._id,
    actorUserId,
    actorName: "System",
    actorRole: "system",
    action: "subscription.trialExpired",
    targetType: "Institute",
    targetId: institute._id,
    targetName: institute.name,
    summary: `Trial expired for institute "${institute.name}"; automatically suspended.`,
    before: { status: "trialing" },
    after: { status: "suspended" },
  });

  return true;
}

/**
 * Batched sweep: finds every trialing subscription whose trial has expired
 * in a single query, then transitions each one. Used by list/detail data
 * loaders and the optional external cron endpoint.
 */
export async function sweepExpiredTrials(): Promise<number> {
  await connectToDatabase();

  const expired = await SubscriptionModel.find({
    status: "trialing",
    trialEndsAt: { $lt: new Date() },
  });

  let transitioned = 0;
  for (const subscription of expired) {
    const didTransition = await evaluateAndSyncSubscriptionStatus(subscription);
    if (didTransition) transitioned += 1;
  }

  return transitioned;
}

async function notifyInstituteAdmins(
  instituteId: unknown,
  notification: { type: "billing" | "trial"; title: string; body: string }
): Promise<void> {
  const admins = await UserModel.find({ instituteId, role: "institute-admin" }).select("_id");
  if (admins.length === 0) return;

  await NotificationModel.insertMany(
    admins.map((admin) => ({
      instituteId,
      userId: admin._id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
    }))
  );
}

/**
 * Notifies an institute's admins once its trial is within `days` days of
 * expiring. Throttled via Subscription.lastTrialReminderAt so repeated lazy
 * sweeps within ~24h don't re-notify. Returns true when a reminder was sent.
 */
export async function checkTrialExpiringSoon(
  subscription: SubscriptionDoc,
  days = 3
): Promise<boolean> {
  if (subscription.status !== "trialing" || !subscription.trialEndsAt) return false;

  const now = new Date();
  const windowEnd = new Date(now.getTime() + days * DAY_MS);
  if (subscription.trialEndsAt < now || subscription.trialEndsAt > windowEnd) return false;

  if (
    subscription.lastTrialReminderAt &&
    now.getTime() - subscription.lastTrialReminderAt.getTime() < REMINDER_THROTTLE_MS
  ) {
    return false;
  }

  const institute = await InstituteModel.findById(subscription.instituteId);
  if (!institute) return false;

  await notifyInstituteAdmins(institute._id, {
    type: "trial",
    title: "Trial ending soon",
    body: `Your trial for "${institute.name}" ends on ${subscription.trialEndsAt.toLocaleDateString()}.`,
  });

  await AuditLogModel.create({
    instituteId: institute._id,
    actorUserId: institute.createdBy,
    actorName: "System",
    actorRole: "system",
    action: "subscription.trialExpiringSoonReminder",
    targetType: "Institute",
    targetId: institute._id,
    targetName: institute.name,
    summary: `Trial-ending-soon reminder sent to admins of institute "${institute.name}".`,
    after: { trialEndsAt: subscription.trialEndsAt },
  });

  subscription.lastTrialReminderAt = now;
  await subscription.save();

  return true;
}

/**
 * Batched sweep: finds every trialing subscription whose trial ends within
 * `days` days (but hasn't expired yet) and reminds each one.
 */
export async function sweepTrialsExpiringSoon(days = 3): Promise<number> {
  await connectToDatabase();

  const now = new Date();
  const windowEnd = new Date(now.getTime() + days * DAY_MS);

  const expiringSoon = await SubscriptionModel.find({
    status: "trialing",
    trialEndsAt: { $gte: now, $lte: windowEnd },
  });

  let notified = 0;
  for (const subscription of expiringSoon) {
    const didNotify = await checkTrialExpiringSoon(subscription, days);
    if (didNotify) notified += 1;
  }

  return notified;
}

/**
 * Flags a pending invoice past its due date as "overdue" and notifies the
 * owning institute's admins. Throttled via
 * PlatformInvoice.lastOverdueReminderAt so repeated lazy sweeps within ~24h
 * don't re-notify; the status flip itself is not throttled.
 */
async function notifyOverdueInvoice(invoice: InvoiceDoc): Promise<boolean> {
  if (invoice.status === "pending") {
    invoice.status = "overdue";
  }

  const now = new Date();
  const throttled =
    invoice.lastOverdueReminderAt &&
    now.getTime() - invoice.lastOverdueReminderAt.getTime() < REMINDER_THROTTLE_MS;

  if (throttled) {
    await invoice.save();
    return false;
  }

  const institute = await InstituteModel.findById(invoice.instituteId);
  if (!institute) {
    await invoice.save();
    return false;
  }

  await notifyInstituteAdmins(institute._id, {
    type: "billing",
    title: "Invoice overdue",
    body: `Invoice ${invoice.invoiceNumber} for "${institute.name}" (${invoice.currency} ${invoice.amount.toFixed(2)}) is overdue.`,
  });

  await AuditLogModel.create({
    instituteId: institute._id,
    actorUserId: institute.createdBy,
    actorName: "System",
    actorRole: "system",
    action: "platformInvoice.overdueReminder",
    targetType: "PlatformInvoice",
    targetId: invoice._id,
    targetName: invoice.invoiceNumber,
    summary: `Overdue-invoice reminder sent to admins of institute "${institute.name}" for invoice ${invoice.invoiceNumber}.`,
    after: { status: invoice.status, dueAt: invoice.dueAt },
  });

  invoice.lastOverdueReminderAt = now;
  await invoice.save();

  return true;
}

/**
 * Batched sweep: finds every pending/overdue invoice past its due date,
 * flips pending ones to "overdue", and reminds each owning institute's
 * admins (throttled). Pass instituteId to scope the sweep to one institute
 * (e.g. from login()); omit it to sweep the whole platform.
 */
export async function notifyOverdueInvoices(instituteId?: string): Promise<number> {
  await connectToDatabase();

  const filter: Record<string, unknown> = {
    status: { $in: ["pending", "overdue"] },
    dueAt: { $lt: new Date() },
  };
  if (instituteId) filter.instituteId = instituteId;

  const overdue = await PlatformInvoiceModel.find(filter);

  let notified = 0;
  for (const invoice of overdue) {
    const didNotify = await notifyOverdueInvoice(invoice);
    if (didNotify) notified += 1;
  }

  return notified;
}
