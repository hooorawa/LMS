import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import SubscriptionModel from "@/models/Subscription";
import PlatformInvoiceModel from "@/models/PlatformInvoice";
import AuditLogModel from "@/models/AuditLog";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { listInstituteHealth } from "@/lib/data/institute-health.data";

export type PlatformAlertSeverity = "critical" | "warning" | "info";

export type PlatformAlert = {
  id: string;
  severity: PlatformAlertSeverity;
  category:
    | "trial-ending"
    | "suspended"
    | "overdue-invoice"
    | "inactive-institute"
    | "deletion-spike";
  title: string;
  description: string;
  href: string;
};

const SEVERITY_RANK: Record<PlatformAlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const TRIAL_ENDING_DAYS = 3;
const INACTIVITY_THRESHOLD_DAYS = 30;
const DELETION_SPIKE_THRESHOLD = 5;
const DELETION_SPIKE_WINDOW_HOURS = 24;
const MAX_ALERTS = 10;

export async function getPlatformAlerts(): Promise<PlatformAlert[]> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();

  const now = new Date();
  const alerts: PlatformAlert[] = [];

  const trialSoonCutoff = new Date(now);
  trialSoonCutoff.setDate(trialSoonCutoff.getDate() + TRIAL_ENDING_DAYS);

  const [trialingSoon, suspendedInstitutes, overdueInvoices, health, recentDeletions] =
    await Promise.all([
      SubscriptionModel.find({
        status: "trialing",
        trialEndsAt: { $gte: now, $lte: trialSoonCutoff },
      })
        .populate("instituteId", "name")
        .lean(),
      InstituteModel.find({ status: "suspended" }).select("name").lean(),
      PlatformInvoiceModel.find({
        status: { $in: ["pending", "overdue"] },
        dueAt: { $lt: now },
      })
        .populate("instituteId", "name")
        .lean(),
      listInstituteHealth(),
      AuditLogModel.find({
        action: { $regex: /\.(delete|remove)$/i },
        createdAt: { $gte: new Date(now.getTime() - DELETION_SPIKE_WINDOW_HOURS * 60 * 60 * 1000) },
      })
        .select("instituteId action")
        .lean(),
    ]);

  for (const subscription of trialingSoon) {
    const institute = subscription.instituteId as unknown as { _id: string; name?: string } | null;
    if (!institute) continue;
    const daysLeft = subscription.trialEndsAt
      ? Math.ceil((new Date(subscription.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    alerts.push({
      id: `trial-${institute._id}`,
      severity: "warning",
      category: "trial-ending",
      title: `Trial ending soon: ${institute.name ?? "Unknown institute"}`,
      description: `Trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
      href: `/institutes/${institute._id}`,
    });
  }

  for (const institute of suspendedInstitutes) {
    alerts.push({
      id: `suspended-${institute._id}`,
      severity: "critical",
      category: "suspended",
      title: `Suspended: ${institute.name}`,
      description: "This institute's access is currently suspended.",
      href: `/institutes/${institute._id}`,
    });
  }

  const overdueByInstitute = new Map<string, { name: string; total: number; count: number }>();
  for (const invoice of overdueInvoices) {
    const institute = invoice.instituteId as unknown as { _id: string; name?: string } | null;
    if (!institute) continue;
    const key = String(institute._id);
    const entry = overdueByInstitute.get(key) ?? {
      name: institute.name ?? "Unknown institute",
      total: 0,
      count: 0,
    };
    entry.total += invoice.amount;
    entry.count += 1;
    overdueByInstitute.set(key, entry);
  }
  for (const [instituteId, entry] of overdueByInstitute) {
    alerts.push({
      id: `overdue-${instituteId}`,
      severity: "critical",
      category: "overdue-invoice",
      title: `Overdue billing: ${entry.name}`,
      description: `${entry.count} overdue invoice${entry.count === 1 ? "" : "s"} totalling ${entry.total.toFixed(2)}.`,
      href: `/billing/invoices`,
    });
  }

  for (const row of health) {
    if (!row.lastActivityAt) {
      alerts.push({
        id: `inactive-${row.id}`,
        severity: "warning",
        category: "inactive-institute",
        title: `No activity recorded: ${row.name}`,
        description: "No login or payment activity has ever been recorded for this institute.",
        href: `/institutes/${row.id}`,
      });
      continue;
    }
    const daysSince = (now.getTime() - row.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > INACTIVITY_THRESHOLD_DAYS) {
      alerts.push({
        id: `inactive-${row.id}`,
        severity: "warning",
        category: "inactive-institute",
        title: `Inactive: ${row.name}`,
        description: `No activity for ${Math.floor(daysSince)} days.`,
        href: `/institutes/${row.id}`,
      });
    }
  }

  const deletionCountByInstitute = new Map<string, number>();
  for (const entry of recentDeletions) {
    if (!entry.instituteId) continue;
    const key = String(entry.instituteId);
    deletionCountByInstitute.set(key, (deletionCountByInstitute.get(key) ?? 0) + 1);
  }
  const spikeInstituteIds = Array.from(deletionCountByInstitute.entries()).filter(
    ([, count]) => count >= DELETION_SPIKE_THRESHOLD
  );
  if (spikeInstituteIds.length > 0) {
    const institutes = await InstituteModel.find({
      _id: { $in: spikeInstituteIds.map(([id]) => id) },
    })
      .select("name")
      .lean();
    const nameById = new Map(institutes.map((institute) => [String(institute._id), institute.name]));
    for (const [instituteId, count] of spikeInstituteIds) {
      alerts.push({
        id: `deletion-spike-${instituteId}`,
        severity: "critical",
        category: "deletion-spike",
        title: `Unusual deletion activity: ${nameById.get(instituteId) ?? "Unknown institute"}`,
        description: `${count} deletions in the last ${DELETION_SPIKE_WINDOW_HOURS} hours.`,
        href: `/audit-log?instituteId=${instituteId}`,
      });
    }
  }

  return alerts
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .slice(0, MAX_ALERTS);
}
